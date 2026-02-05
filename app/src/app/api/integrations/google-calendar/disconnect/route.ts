import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revokeAccess } from '@/lib/google-calendar';

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

  try {
    await revokeAccess();

    // Clear google_event_id from all bookings (mark as not_applicable)
    await supabase
      .from('bookings')
      .update({
        google_sync_status: 'not_applicable',
        google_event_id: null,
        google_sync_error: null,
      })
      .neq('google_sync_status', 'not_applicable');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to disconnect Google Calendar:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect integration' },
      { status: 500 }
    );
  }
}
