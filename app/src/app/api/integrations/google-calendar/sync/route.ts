import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  isGoogleCalendarConfigured,
  getStoredIntegration,
  syncBookingToCalendar,
} from '@/lib/google-calendar';
import type { SyncResult } from '@/types/integrations';

export const dynamic = 'force-dynamic';

export async function POST() {
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

  // Check configuration
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: 'Google Calendar integration is not configured' },
      { status: 503 }
    );
  }

  // Check if connected
  const integration = await getStoredIntegration();
  if (!integration) {
    return NextResponse.json(
      { error: 'Google Calendar is not connected' },
      { status: 400 }
    );
  }

  // Get bookings that need syncing (pending or failed)
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id')
    .in('status', ['confirmed', 'pending'])
    .in('google_sync_status', ['pending', 'failed'])
    .order('start_time', { ascending: true })
    .limit(50); // Process in batches

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!bookings || bookings.length === 0) {
    const result: SyncResult = { synced: 0, failed: 0, errors: [] };
    return NextResponse.json(result);
  }

  const result: SyncResult = {
    synced: 0,
    failed: 0,
    errors: [],
  };

  // Sync each booking
  for (const booking of bookings) {
    try {
      await syncBookingToCalendar(booking.id);
      result.synced++;
    } catch (err) {
      result.failed++;
      result.errors.push({
        bookingId: booking.id,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  // Update last sync timestamp
  await supabase
    .from('admin_integrations')
    .update({
      last_sync_at: new Date().toISOString(),
    })
    .eq('integration_type', 'google_calendar');

  return NextResponse.json(result);
}
