import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export interface DashboardStats {
  revenueThisMonth: number;
  activeClients: number;
  sessionsThisWeek: number;
  sessionsToday: number;
  outstandingInvoices: {
    count: number;
    totalCents: number;
  };
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

    // Get start of month and week in Pacific time
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all stats in parallel
    const [
      revenueResult,
      clientsResult,
      weekSessionsResult,
      todaySessionsResult,
      outstandingResult,
    ] = await Promise.all([
      // Revenue this month (paid invoices)
      supabase
        .from('invoices')
        .select('total_cents')
        .eq('status', 'paid')
        .gte('paid_at', startOfMonth.toISOString()),

      // Active clients (profiles with athletes)
      supabase
        .from('athletes')
        .select('parent_id')
        .eq('is_active', true),

      // Sessions this week
      supabase
        .from('bookings')
        .select('id')
        .gte('start_time', startOfWeek.toISOString())
        .in('status', ['confirmed', 'pending', 'completed']),

      // Sessions today
      supabase
        .from('bookings')
        .select('id')
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .in('status', ['confirmed', 'pending', 'completed']),

      // Outstanding invoices
      supabase
        .from('invoices')
        .select('total_cents')
        .in('status', ['draft', 'sent', 'overdue']),
    ]);

    // Calculate revenue
    const revenueThisMonth = revenueResult.data?.reduce(
      (sum, inv) => sum + (inv.total_cents || 0),
      0
    ) || 0;

    // Count unique clients
    const uniqueParentIds = new Set(
      clientsResult.data?.map((a) => a.parent_id) || []
    );
    const activeClients = uniqueParentIds.size;

    // Sessions
    const sessionsThisWeek = weekSessionsResult.data?.length || 0;
    const sessionsToday = todaySessionsResult.data?.length || 0;

    // Outstanding
    const outstandingInvoices = {
      count: outstandingResult.data?.length || 0,
      totalCents: outstandingResult.data?.reduce(
        (sum, inv) => sum + (inv.total_cents || 0),
        0
      ) || 0,
    };

    const stats: DashboardStats = {
      revenueThisMonth,
      activeClients,
      sessionsThisWeek,
      sessionsToday,
      outstandingInvoices,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
