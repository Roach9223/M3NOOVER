import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addMinutes, isBefore } from 'date-fns';
import { isGoogleCalendarConfigured, syncBookingToCalendar } from '@/lib/google-calendar';

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');
  const status = searchParams.get('status');

  let query = supabase
    .from('bookings')
    .select(`
      *,
      session_type:session_types(*),
      parent:profiles!parent_id(id, full_name)
    `)
    .order('start_time', { ascending: true });

  // Non-admin users can only see their own bookings
  if (profile?.role !== 'admin') {
    query = query.eq('parent_id', user.id);
  }

  if (startDate) {
    query = query.gte('start_time', startDate);
  }
  if (endDate) {
    query = query.lte('start_time', endDate);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { session_type_id, start_time, notes } = body;

  if (!session_type_id || !start_time) {
    return NextResponse.json({ error: 'session_type_id and start_time required' }, { status: 400 });
  }

  // Get session type
  const { data: sessionType } = await supabase
    .from('session_types')
    .select('*')
    .eq('id', session_type_id)
    .eq('is_active', true)
    .single();

  if (!sessionType) {
    return NextResponse.json({ error: 'Invalid session type' }, { status: 400 });
  }

  // Get settings
  const { data: settings } = await supabase
    .from('scheduling_settings')
    .select('*')
    .single();

  const minNoticeHours = settings?.min_booking_notice_hours || 2;

  // Validate start time
  const startDate = new Date(start_time);
  const now = new Date();
  const minBookingTime = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000);

  if (isBefore(startDate, minBookingTime)) {
    return NextResponse.json(
      { error: `Booking must be at least ${minNoticeHours} hours in advance` },
      { status: 400 }
    );
  }

  // Calculate end time
  const endDate = addMinutes(startDate, sessionType.duration_minutes);

  // Check for conflicting bookings
  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id')
    .in('status', ['confirmed', 'pending'])
    .lt('start_time', endDate.toISOString())
    .gt('end_time', startDate.toISOString());

  if (conflicts && conflicts.length >= sessionType.max_athletes) {
    return NextResponse.json({ error: 'This time slot is fully booked' }, { status: 400 });
  }

  // Create booking
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      parent_id: user.id,
      session_type_id,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      notes: notes || null,
      status: 'confirmed',
    })
    .select(`
      *,
      session_type:session_types(*)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // TODO: Send confirmation email

  // Sync to Google Calendar (non-blocking)
  if (isGoogleCalendarConfigured()) {
    syncBookingToCalendar(data.id).catch((err) =>
      console.error('Calendar sync failed:', err)
    );
  }

  return NextResponse.json(data, { status: 201 });
}
