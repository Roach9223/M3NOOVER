import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

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

    // Check if email already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', body.parent.email)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { error: 'A client with this email already exists' },
        { status: 400 }
      );
    }

    // Create the parent profile
    // Note: In a real implementation, you might want to use Supabase Admin API
    // to create the user account, or send an invite email
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        full_name: body.parent.name,
        email: body.parent.email,
        phone: body.parent.phone,
        role: 'parent',
      })
      .select()
      .single();

    if (profileError) {
      logger.error('Failed to create client profile', profileError);
      return NextResponse.json(
        { error: 'Failed to create client profile' },
        { status: 500 }
      );
    }

    // Create athletes
    const athleteInserts = body.athletes.map((athlete) => ({
      parent_id: newProfile.id,
      name: athlete.name,
      date_of_birth: athlete.date_of_birth,
      sports: athlete.sports,
      school: athlete.school,
      is_active: true,
    }));

    const { error: athletesError } = await supabase
      .from('athletes')
      .insert(athleteInserts);

    if (athletesError) {
      logger.error('Failed to create athletes', athletesError);
      // Try to clean up the profile
      await supabase.from('profiles').delete().eq('id', newProfile.id);
      return NextResponse.json(
        { error: 'Failed to create athletes' },
        { status: 500 }
      );
    }

    // Create subscription if specified
    if (body.subscription?.package_id) {
      const { error: subError } = await supabase
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

    // TODO: Send invite email if body.send_invite is true
    // This would use Resend or another email service

    return NextResponse.json({
      id: newProfile.id,
      message: 'Client created successfully',
    });
  } catch (error) {
    logger.error('Failed to create client', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}
