import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/session-notes/[id] - Update session note (admin only)
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

  // Only admin can update notes
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check note exists
  const { data: existing } = await supabase
    .from('session_notes')
    .select('id')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  // Only allow specific fields to be updated
  if (body.worked_on !== undefined) updates.worked_on = body.worked_on;
  if (body.progress_observations !== undefined) updates.progress_observations = body.progress_observations;
  if (body.focus_areas !== undefined) updates.focus_areas = body.focus_areas;
  if (body.effort_rating !== undefined) {
    if (body.effort_rating !== null && (!Number.isInteger(body.effort_rating) || body.effort_rating < 1 || body.effort_rating > 5)) {
      return NextResponse.json(
        { error: 'effort_rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }
    updates.effort_rating = body.effort_rating;
  }
  if (body.needs_attention !== undefined) {
    updates.needs_attention = body.needs_attention;
    updates.attention_reason = body.needs_attention ? body.attention_reason : null;
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('session_notes')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      athlete:athletes(id, name),
      booking:bookings(id, start_time, session_type:session_types(name))
    `)
    .single();

  if (error) {
    console.error('Failed to update session note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/session-notes/[id] - Delete session note (admin only)
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

  // Only admin can delete notes
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase
    .from('session_notes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete session note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
