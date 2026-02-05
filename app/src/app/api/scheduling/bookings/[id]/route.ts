import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { differenceInHours } from 'date-fns';
import {
  isGoogleCalendarConfigured,
  syncBookingToCalendar,
  deleteCalendarEvent,
} from '@/lib/google-calendar';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  let query = supabase
    .from('bookings')
    .select(`
      *,
      session_type:session_types(*),
      parent:profiles!parent_id(id, full_name)
    `)
    .eq('id', id);

  // Non-admin can only see their own bookings
  if (profile?.role !== 'admin') {
    query = query.eq('parent_id', user.id);
  }

  const { data, error } = await query.single();

  if (error) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Get existing booking
  const { data: existing } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Non-admin can only modify their own bookings
  if (profile?.role !== 'admin' && existing.parent_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  // Admin can update any field
  if (profile?.role === 'admin') {
    const adminAllowed = ['status', 'notes', 'start_time', 'end_time'];
    for (const field of adminAllowed) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }
  } else {
    // Parents can only update notes
    if (body.notes !== undefined) {
      updates.notes = body.notes;
    }
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      session_type:session_types(*)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sync update to Google Calendar (non-blocking)
  // Only sync if time-related fields were updated
  if (isGoogleCalendarConfigured() && (updates.start_time || updates.end_time || updates.notes)) {
    syncBookingToCalendar(id).catch((err) =>
      console.error('Calendar sync failed:', err)
    );
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Get existing booking
  const { data: existing } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Non-admin can only cancel their own bookings
  if (profile?.role !== 'admin' && existing.parent_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check cancellation policy for non-admin
  if (profile?.role !== 'admin') {
    const { data: settings } = await supabase
      .from('scheduling_settings')
      .select('cancellation_notice_hours')
      .single();

    const cancellationNotice = settings?.cancellation_notice_hours || 24;
    const bookingStart = new Date(existing.start_time);
    const hoursUntilBooking = differenceInHours(bookingStart, new Date());

    if (hoursUntilBooking < cancellationNotice) {
      return NextResponse.json(
        { error: `Cancellations require ${cancellationNotice} hours notice` },
        { status: 400 }
      );
    }
  }

  const body = await request.json().catch(() => ({}));

  // Update to cancelled status
  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
      cancellation_reason: body.reason || null,
      updated_at: new Date().toISOString(),
      google_sync_status: 'not_applicable',
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Delete from Google Calendar (non-blocking)
  if (isGoogleCalendarConfigured() && existing.google_event_id) {
    deleteCalendarEvent(existing.google_event_id).catch((err) =>
      console.error('Calendar delete failed:', err)
    );
  }

  // TODO: Send cancellation notification

  return NextResponse.json({ success: true });
}
