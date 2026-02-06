import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/athletes - List athletes for current parent (or all for admin)
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  // Parse query params
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get('parent_id');
  const includeInactive = searchParams.get('include_inactive') === 'true';

  let query = supabase
    .from('athletes')
    .select(`
      *,
      parent:profiles!parent_id(id, full_name)
    `)
    .order('name');

  // Filter by parent unless admin requesting all
  if (!isAdmin) {
    query = query.eq('parent_id', user.id);
  } else if (parentId) {
    query = query.eq('parent_id', parentId);
  }

  // Filter inactive unless requested
  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch athletes:', error);
    return NextResponse.json({ error: 'Failed to fetch athletes' }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/athletes - Create new athlete
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, date_of_birth, sports, school, notes } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  // Check if admin - can create for any parent
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';
  const parentId = isAdmin && body.parent_id ? body.parent_id : user.id;

  const { data, error } = await supabase
    .from('athletes')
    .insert({
      parent_id: parentId,
      name: name.trim(),
      date_of_birth: date_of_birth || null,
      sports: sports || [],
      school: school || null,
      notes: notes || null,
    })
    .select(`
      *,
      parent:profiles!parent_id(id, full_name)
    `)
    .single();

  if (error) {
    console.error('Failed to create athlete:', error);
    return NextResponse.json({ error: 'Failed to create athlete' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
