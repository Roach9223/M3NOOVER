import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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

    // Check environment variables
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const stripeKeySet = !!stripeKey;
    const stripeKeyIsTest = stripeKey?.startsWith('sk_test_') || false;

    const webhookSecretSet = !!process.env.STRIPE_WEBHOOK_SECRET;
    const supabaseUrlSet = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKeySet = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const appUrlSet = !!process.env.NEXT_PUBLIC_APP_URL;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    // Check session types
    const { count: sessionTypesCount } = await supabase
      .from('session_types')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Check availability templates
    const { count: availabilityCount } = await supabase
      .from('availability_templates')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    return NextResponse.json({
      stripeKeySet,
      stripeKeyIsTest,
      webhookSecretSet,
      supabaseUrlSet,
      serviceRoleKeySet,
      appUrlSet,
      appUrl,
      sessionTypesCount: sessionTypesCount || 0,
      availabilityCount: availabilityCount || 0,
    });
  } catch (error) {
    console.error('Go-live status error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
