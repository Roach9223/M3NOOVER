import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { logger } from '@/lib/logger';

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

// GET /api/admin/clients - List all clients with their athletes
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all parent profiles with their athletes
    const { data: clients, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        created_at,
        athletes (
          id,
          name,
          is_active
        )
      `)
      .eq('role', 'parent')
      .order('full_name', { ascending: true });

    if (error) {
      logger.error('Failed to fetch clients', error);
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }

    // Filter to only include active athletes
    const clientsWithActiveAthletes = clients?.map((client) => ({
      ...client,
      athletes: client.athletes?.filter((a: { is_active: boolean }) => a.is_active) || [],
    }));

    return NextResponse.json(clientsWithActiveAthletes || []);
  } catch (error) {
    logger.error('Failed to fetch clients', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

interface CreateClientRequest {
  parent: {
    name: string;
    email: string;
    phone: string | null;
  };
  athletes: {
    name: string;
    date_of_birth: string | null;
    sports: string[];
    school: string | null;
  }[];
  subscription: {
    package_id: string;
  } | null;
  send_invite: boolean;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: CreateClientRequest = await request.json();

    // Validate required fields
    if (!body.parent.name || !body.parent.email) {
      return NextResponse.json(
        { error: 'Parent name and email are required' },
        { status: 400 }
      );
    }

    if (!body.athletes || body.athletes.length === 0) {
      return NextResponse.json(
        { error: 'At least one athlete is required' },
        { status: 400 }
      );
    }

    for (const athlete of body.athletes) {
      if (!athlete.name) {
        return NextResponse.json(
          { error: 'All athletes must have a name' },
          { status: 400 }
        );
      }
    }

    // Use admin client for privileged operations
    const supabaseAdmin = createAdminClient();

    // Check if email already exists in auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === body.parent.email.toLowerCase()
    );

    if (existingUser) {
      return NextResponse.json(
        { error: 'A client with this email already exists' },
        { status: 400 }
      );
    }

    // Create Supabase auth user with metadata
    // The handle_new_user trigger will auto-create the profile
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.parent.email,
      email_confirm: false,
      user_metadata: {
        full_name: body.parent.name,
        phone: body.parent.phone,
        role: 'parent',
      },
    });

    if (authError || !authData.user) {
      logger.error('Failed to create auth user', authError);
      return NextResponse.json(
        { error: 'Failed to create client account' },
        { status: 500 }
      );
    }

    const newUserId = authData.user.id;

    // Wait a moment for the trigger to create the profile
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Fetch the created profile
    const { data: newProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select()
      .eq('id', newUserId)
      .single();

    if (profileError || !newProfile) {
      logger.error('Failed to fetch created profile', profileError);
      // Clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json(
        { error: 'Failed to create client profile' },
        { status: 500 }
      );
    }

    // Create athletes using admin client (bypasses RLS)
    const athleteInserts = body.athletes.map((athlete) => ({
      parent_id: newProfile.id,
      name: athlete.name,
      date_of_birth: athlete.date_of_birth,
      sports: athlete.sports,
      school: athlete.school,
      is_active: true,
    }));

    const { error: athletesError } = await supabaseAdmin
      .from('athletes')
      .insert(athleteInserts);

    if (athletesError) {
      logger.error('Failed to create athletes', athletesError);
      // Clean up auth user (cascade will delete profile)
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json(
        { error: 'Failed to create athletes' },
        { status: 500 }
      );
    }

    // Create subscription if specified
    if (body.subscription?.package_id) {
      const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: newProfile.id,
          package_id: body.subscription.package_id,
          status: 'pending', // Will be activated when they complete payment
        });

      if (subError) {
        logger.error('Failed to create subscription', subError);
        // Non-fatal - client was still created
      }
    }

    // Send invite email if requested
    let emailSent = false;
    if (body.send_invite) {
      try {
        // Generate magic link for password setup
        const { data: linkData, error: linkError } =
          await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: body.parent.email,
            options: {
              redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
            },
          });

        if (linkError || !linkData) {
          logger.error('Failed to generate magic link', linkError);
        } else {
          const resendApiKey = process.env.RESEND_API_KEY;
          if (resendApiKey) {
            const resend = new Resend(resendApiKey);
            const athleteNames = body.athletes.map((a) => a.name).join(', ');

            await resend.emails.send({
              from: 'Coach Chuck <noreply@m3noover.com>',
              to: body.parent.email,
              subject: 'Welcome to M3NOOVER - Access Your Portal',
              html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #171717; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">M3NOOVER</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #737373; text-transform: uppercase; letter-spacing: 2px;">Mindset · Movement · Mastery</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <h2 style="margin: 0 0 16px; font-size: 22px; color: #ffffff;">Welcome to the Team, ${escapeHtml(body.parent.name)}!</h2>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #a3a3a3;">
                Coach Chuck has set up your M3NOOVER portal account. Through this portal, you'll be able to:
              </p>

              <ul style="margin: 0 0 24px; padding-left: 20px; color: #a3a3a3; font-size: 16px; line-height: 1.8;">
                <li>Book training sessions for ${escapeHtml(athleteNames)}</li>
                <li>View upcoming and past sessions</li>
                <li>Manage payments and view invoices</li>
                <li>Track your athlete's progress</li>
              </ul>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #a3a3a3;">
                Click the button below to access your portal. This link will expire in 24 hours.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${linkData.properties.action_link}" style="display: inline-block; padding: 16px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      Access Your Portal
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 14px; color: #737373; line-height: 1.6;">
                If you have any questions, feel free to reach out to Coach Chuck directly.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #0f0f0f; border-top: 1px solid #262626;">
              <p style="margin: 0; font-size: 12px; color: #525252; text-align: center;">
                M3NOOVER · Building Strong Bodies, Disciplined Minds, and Confident Athletes
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
              `,
            });

            emailSent = true;
            logger.info('Invite email sent', { email: body.parent.email });
          } else {
            logger.warn('RESEND_API_KEY not configured, skipping invite email');
          }
        }
      } catch (emailError) {
        logger.error('Failed to send invite email', emailError);
        // Non-fatal - client was still created
      }
    }

    return NextResponse.json({
      id: newProfile.id,
      message: 'Client created successfully',
      email_sent: emailSent,
    });
  } catch (error) {
    logger.error('Failed to create client', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}
