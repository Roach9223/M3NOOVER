import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import {
  exchangeCodeForTokens,
  getUserEmail,
  storeIntegrationTokens,
  isGoogleCalendarConfigured,
} from '@/lib/google-calendar';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const redirectUrl = `${baseUrl}/admin/settings/integrations`;

  // Handle OAuth errors
  if (error) {
    logger.warn('Google OAuth denied', { error });
    return NextResponse.redirect(`${redirectUrl}?error=oauth_denied`);
  }

  // Verify required parameters
  if (!code || !state) {
    return NextResponse.redirect(`${redirectUrl}?error=missing_params`);
  }

  // Check configuration
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.redirect(`${redirectUrl}?error=not_configured`);
  }

  // Verify state parameter
  const cookieStore = await cookies();
  const storedState = cookieStore.get('google_oauth_state')?.value;

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${redirectUrl}?error=invalid_state`);
  }

  // Verify user is authenticated admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${redirectUrl}?error=not_authenticated`);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.redirect(`${redirectUrl}?error=not_admin`);
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Get user email
    const email = await getUserEmail(tokens.access_token);

    // Store encrypted tokens
    await storeIntegrationTokens(tokens, email);

    // Clear state cookie
    const response = NextResponse.redirect(`${redirectUrl}?success=true`);
    response.cookies.delete('google_oauth_state');

    return response;
  } catch (err) {
    logger.error('Failed to complete Google OAuth', err);
    return NextResponse.redirect(`${redirectUrl}?error=token_exchange_failed`);
  }
}
