import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addMinutes } from 'date-fns';
import { isGoogleCalendarConfigured, syncBookingToCalendar } from '@/lib/google-calendar';
import { logger } from '@/lib/logger';

interface AdminBookingRequest {
  parent_id: string;
  athlete_id?: string;
  session_type_id: string;
  start_time: string;
  notes?: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body: AdminBookingRequest = await request.json();
  const { parent_id, athlete_id, session_type_id, start_time, notes } = body;

  // Validate required fields
  if (!parent_id || !session_type_id || !start_time) {
    return NextResponse.json(
      { error: 'parent_id, session_type_id, and start_time are required' },
      { status: 400 }
    );
  }

  // Verify parent exists
  const { data: parent, error: parentError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', parent_id)
    .single();

  if (parentError || !parent) {
    return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
  }

  // Verify athlete belongs to parent if specified
  if (athlete_id) {
    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .select('id, parent_id')
      .eq('id', athlete_id)
      .single();

    if (athleteError || !athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    if (athlete.parent_id !== parent_id) {
      return NextResponse.json(
        { error: 'Athlete does not belong to selected parent' },
        { status: 400 }
      );
    }
  }

  // Get session type
  const { data: sessionType, error: typeError } = await supabase
    .from('session_types')
    .select('*')
    .eq('id', session_type_id)
    .eq('is_active', true)
    .single();

  if (typeError || !sessionType) {
    return NextResponse.json({ error: 'Invalid session type' }, { status: 400 });
  }

  // Calculate end time
  const startDate = new Date(start_time);
  const endDate = addMinutes(startDate, sessionType.duration_minutes);

  // Check for conflicting bookings
  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id')
    .in('status', ['confirmed', 'pending'])
    .lt('start_time', endDate.toISOString())
    .gt('end_time', startDate.toISOString());

  if (conflicts && conflicts.length >= sessionType.max_athletes) {
    return NextResponse.json(
      { error: 'This time slot is fully booked' },
      { status: 400 }
    );
  }

  // Create the booking (admin can bypass min notice requirement)
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      parent_id,
      athlete_id: athlete_id || null,
      session_type_id,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      notes: notes || null,
      status: 'confirmed',
    })
    .select(`
      *,
      session_type:session_types(*),
      parent:profiles!parent_id(id, full_name, email),
      athlete:athletes(id, name)
    `)
    .single();

  if (bookingError) {
    logger.error('Failed to create admin booking', bookingError);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }

  // Sync to Google Calendar (non-blocking)
  if (isGoogleCalendarConfigured()) {
    syncBookingToCalendar(booking.id).catch((err) =>
      console.error('Calendar sync failed:', err)
    );
  }

  logger.info('Admin created booking', {
    booking_id: booking.id,
    parent_id,
    admin_id: user.id,
  });

  return NextResponse.json(booking, { status: 201 });
}
