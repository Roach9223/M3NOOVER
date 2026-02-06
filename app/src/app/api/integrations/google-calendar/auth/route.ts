import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUrl, isGoogleCalendarConfigured } from '@/lib/google-calendar';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Check if Google Calendar is configured
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: 'Google Calendar integration is not configured' },
      { status: 503 }
    );
  }

  const supabase = await createClient();

  // Check authentication
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
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  // Generate state parameter for CSRF protection
  const state = crypto.randomBytes(32).toString('hex');

  // Store state in a cookie (expires in 10 minutes)
  const authUrl = getAuthUrl(state);

  const response = NextResponse.json({ authUrl });

  // Set state cookie for verification in callback
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  return response;
}
