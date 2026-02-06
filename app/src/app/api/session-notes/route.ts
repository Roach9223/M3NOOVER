import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/session-notes - List session notes (admin only, or filtered by athlete)
export async function GET(request: Request) {
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

  const isAdmin = profile?.role === 'admin';

  // Parse query params
  const { searchParams } = new URL(request.url);
  const athleteId = searchParams.get('athlete_id');
  const bookingId = searchParams.get('booking_id');
  const needsAttention = searchParams.get('needs_attention');
  const limit = parseInt(searchParams.get('limit') || '50');

  let query = supabase
    .from('session_notes')
    .select(`
      *,
      athlete:athletes(id, name, parent_id),
      booking:bookings(id, start_time, session_type:session_types(name))
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (athleteId) {
    query = query.eq('athlete_id', athleteId);
  }

  if (bookingId) {
    query = query.eq('booking_id', bookingId);
  }

  if (needsAttention === 'true') {
    query = query.eq('needs_attention', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch session notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }

  // If not admin, filter to only show notes for user's athletes
  if (!isAdmin && data) {
    const filtered = data.filter(note => note.athlete?.parent_id === user.id);
    return NextResponse.json(filtered);
  }

  return NextResponse.json(data);
}

// POST /api/session-notes - Create session note (admin only)
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only admin can create notes
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const {
    booking_id,
    athlete_id,
    worked_on,
    progress_observations,
    focus_areas,
    effort_rating,
    needs_attention,
    attention_reason,
  } = body;

  // Validate required fields
  if (!booking_id || !athlete_id || !worked_on) {
    return NextResponse.json(
      { error: 'booking_id, athlete_id, and worked_on are required' },
      { status: 400 }
    );
  }

  // Validate effort rating if provided
  if (effort_rating !== undefined && effort_rating !== null) {
    if (!Number.isInteger(effort_rating) || effort_rating < 1 || effort_rating > 5) {
      return NextResponse.json(
        { error: 'effort_rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }
  }

  // Verify booking exists and belongs to athlete
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, athlete_id')
    .eq('id', booking_id)
    .single();

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Verify athlete exists
  const { data: athlete } = await supabase
    .from('athletes')
    .select('id')
    .eq('id', athlete_id)
    .single();

  if (!athlete) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('session_notes')
    .insert({
      booking_id,
      athlete_id,
      coach_id: user.id,
      worked_on,
      progress_observations: progress_observations || null,
      focus_areas: focus_areas || null,
      effort_rating: effort_rating || null,
      needs_attention: needs_attention || false,
      attention_reason: needs_attention ? attention_reason : null,
    })
    .select(`
      *,
      athlete:athletes(id, name),
      booking:bookings(id, start_time, session_type:session_types(name))
    `)
    .single();

  if (error) {
    console.error('Failed to create session note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
