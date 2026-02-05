import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/athletes/[id] - Get single athlete
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

  const { data, error } = await supabase
    .from('athletes')
    .select(`
      *,
      parent:profiles!parent_id(id, full_name)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
  }

  // Check access - parent can only see own athletes
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  if (!isAdmin && data.parent_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(data);
}

// PATCH /api/athletes/[id] - Update athlete
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

  // Get existing athlete to check ownership
  const { data: existing } = await supabase
    .from('athletes')
    .select('parent_id')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
  }

  // Check access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  if (!isAdmin && existing.parent_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  // Only allow specific fields to be updated
  if (body.name !== undefined) updates.name = body.name;
  if (body.date_of_birth !== undefined) updates.date_of_birth = body.date_of_birth;
  if (body.sports !== undefined) updates.sports = body.sports;
  if (body.school !== undefined) updates.school = body.school;
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.profile_image_url !== undefined) updates.profile_image_url = body.profile_image_url;
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('athletes')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      parent:profiles!parent_id(id, full_name)
    `)
    .single();

  if (error) {
    console.error('Failed to update athlete:', error);
    return NextResponse.json({ error: 'Failed to update athlete' }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/athletes/[id] - Soft delete (set is_active = false)
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

  // Get existing athlete to check ownership
  const { data: existing } = await supabase
    .from('athletes')
    .select('parent_id')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
  }

  // Check access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  if (!isAdmin && existing.parent_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Soft delete
  const { error } = await supabase
    .from('athletes')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Failed to delete athlete:', error);
    return NextResponse.json({ error: 'Failed to delete athlete' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
