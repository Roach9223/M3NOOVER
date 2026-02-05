import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isGoogleCalendarConfigured, getStoredIntegration } from '@/lib/google-calendar';
import type { GoogleCalendarStatus } from '@/types/integrations';

export async function GET() {
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

  // Check if integration is configured
  const configured = isGoogleCalendarConfigured();

  if (!configured) {
    const status: GoogleCalendarStatus & { configured: boolean } = {
      configured: false,
      connected: false,
      email: null,
      calendarId: null,
      lastSync: null,
      lastError: null,
    };
    return NextResponse.json(status);
  }

  // Get stored integration
  const integration = await getStoredIntegration();

  const status: GoogleCalendarStatus & { configured: boolean } = {
    configured: true,
    connected: !!integration,
    email: integration?.account_email || null,
    calendarId: integration?.calendar_id || null,
    lastSync: integration?.last_sync_at || null,
    lastError: integration?.last_error || null,
  };

  return NextResponse.json(status);
}
