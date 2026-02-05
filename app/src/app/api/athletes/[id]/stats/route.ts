import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';

// GET /api/athletes/[id]/stats - Get athlete statistics
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

  // Get athlete to verify access
  const { data: athlete } = await supabase
    .from('athletes')
    .select('parent_id')
    .eq('id', id)
    .single();

  if (!athlete) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
  }

  // Check access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  if (!isAdmin && athlete.parent_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get all bookings for this athlete
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, start_time, status')
    .eq('athlete_id', id)
    .order('start_time', { ascending: false });

  const allBookings = bookings || [];
  const completedBookings = allBookings.filter(b => b.status === 'completed');

  // Get session notes for effort ratings
  const { data: notes } = await supabase
    .from('session_notes')
    .select('effort_rating')
    .eq('athlete_id', id)
    .not('effort_rating', 'is', null);

  // Calculate average effort
  let averageEffort: number | null = null;
  if (notes && notes.length > 0) {
    const sum = notes.reduce((acc, n) => acc + (n.effort_rating || 0), 0);
    averageEffort = Math.round((sum / notes.length) * 10) / 10;
  }

  // Calculate streak
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  const today = startOfDay(new Date());

  // Sort completed bookings by date descending
  const sortedCompleted = completedBookings
    .map(b => startOfDay(parseISO(b.start_time)))
    .sort((a, b) => b.getTime() - a.getTime());

  if (sortedCompleted.length > 0) {
    // Check if most recent session was within last 7 days
    const daysSinceLastSession = differenceInDays(today, sortedCompleted[0]);

    if (daysSinceLastSession <= 7) {
      currentStreak = 1;
      for (let i = 1; i < sortedCompleted.length; i++) {
        const daysBetween = differenceInDays(sortedCompleted[i - 1], sortedCompleted[i]);
        if (daysBetween <= 7) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    tempStreak = 1;
    for (let i = 1; i < sortedCompleted.length; i++) {
      const daysBetween = differenceInDays(sortedCompleted[i - 1], sortedCompleted[i]);
      if (daysBetween <= 7) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  const stats = {
    totalSessions: allBookings.length,
    completedSessions: completedBookings.length,
    currentStreak,
    longestStreak,
    averageEffort,
    lastSessionDate: completedBookings[0]?.start_time || null,
  };

  return NextResponse.json(stats);
}
