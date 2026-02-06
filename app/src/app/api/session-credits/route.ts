import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's session credits (aggregated)
    const { data: credits, error } = await supabase
      .from('session_credits')
      .select('total_sessions, used_sessions, product_type, purchased_at, expires_at')
      .eq('profile_id', user.id)
      .or('expires_at.is.null,expires_at.gt.now()');

    if (error) {
      console.error('Failed to fetch session credits:', error);
      return NextResponse.json(
        { error: 'Failed to fetch session credits' },
        { status: 500 }
      );
    }

    // Calculate totals
    const totalSessions = credits?.reduce((sum, c) => sum + c.total_sessions, 0) || 0;
    const usedSessions = credits?.reduce((sum, c) => sum + c.used_sessions, 0) || 0;
    const availableSessions = credits?.reduce(
      (sum, c) => sum + (c.total_sessions - c.used_sessions),
      0
    ) || 0;

    return NextResponse.json({
      total_sessions: totalSessions,
      used_sessions: usedSessions,
      available_sessions: availableSessions,
      packs: credits || [],
    });
  } catch (error) {
    console.error('Error fetching session credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session credits' },
      { status: 500 }
    );
  }
}
