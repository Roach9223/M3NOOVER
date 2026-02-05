import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export interface ActivityItem {
  type: 'session_completed' | 'payment_received' | 'new_booking' | 'note_added';
  timestamp: string;
  description: string;
  entityId: string;
}

export async function GET() {
  try {
    const supabase = await createClient();
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const activities: ActivityItem[] = [];

    // Get recent completed sessions (last 7 days)
    const { data: completedSessions } = await supabase
      .from('bookings')
      .select(`
        id,
        updated_at,
        athletes!inner(name)
      `)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
      .limit(5);

    if (completedSessions) {
      for (const session of completedSessions) {
        const athlete = session.athletes as unknown as { name: string } | null;
        const athleteName = athlete?.name || 'Unknown';
        activities.push({
          type: 'session_completed',
          timestamp: session.updated_at,
          description: `Session completed - ${athleteName}`,
          entityId: session.id,
        });
      }
    }

    // Get recent payments
    const { data: recentPayments } = await supabase
      .from('invoices')
      .select(`
        id,
        paid_at,
        total_cents,
        profiles!inner(full_name)
      `)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })
      .limit(5);

    if (recentPayments) {
      for (const payment of recentPayments) {
        const clientProfile = payment.profiles as unknown as { full_name: string | null } | null;
        const clientName = clientProfile?.full_name || 'Unknown';
        const amount = (payment.total_cents / 100).toFixed(0);
        activities.push({
          type: 'payment_received',
          timestamp: payment.paid_at!,
          description: `Payment received - ${clientName} ($${amount})`,
          entityId: payment.id,
        });
      }
    }

    // Get recent bookings
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select(`
        id,
        created_at,
        athletes!inner(name)
      `)
      .in('status', ['confirmed', 'pending'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentBookings) {
      for (const booking of recentBookings) {
        const athlete = booking.athletes as unknown as { name: string } | null;
        const athleteName = athlete?.name || 'Unknown';
        activities.push({
          type: 'new_booking',
          timestamp: booking.created_at,
          description: `New booking - ${athleteName}`,
          entityId: booking.id,
        });
      }
    }

    // Get recent notes
    const { data: recentNotes } = await supabase
      .from('session_notes')
      .select(`
        id,
        created_at,
        athletes!inner(name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentNotes) {
      for (const note of recentNotes) {
        const athlete = note.athletes as unknown as { name: string } | null;
        const athleteName = athlete?.name || 'Unknown';
        activities.push({
          type: 'note_added',
          timestamp: note.created_at,
          description: `Note added - ${athleteName}`,
          entityId: note.id,
        });
      }
    }

    // Sort all activities by timestamp descending
    activities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Return top 10
    return NextResponse.json(activities.slice(0, 10));
  } catch (error) {
    console.error('Recent activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    );
  }
}
