import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import type { SessionData } from '@/components/admin/SessionRow';
import type { ActivityItem } from '@/app/api/admin/recent-activity/route';
import { STRIPE_PRODUCTS, type SubscriptionTier } from '@/lib/stripe/products';

export const dynamic = 'force-dynamic';

export interface DashboardStats {
  revenueThisMonth: number;
  mrr: number;
  activeClients: number;
  sessionsThisWeek: number;
  sessionsToday: number;
  outstandingInvoices: {
    count: number;
    totalCents: number;
  };
}

export const metadata = {
  title: 'Admin Dashboard',
};

async function getTodaySessions(supabase: Awaited<ReturnType<typeof createClient>>): Promise<SessionData[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      start_time,
      status,
      duration_minutes,
      athletes!inner(id, name),
      session_types(name)
    `)
    .gte('start_time', today.toISOString())
    .lt('start_time', tomorrow.toISOString())
    .in('status', ['confirmed', 'pending', 'completed'])
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching today sessions:', error);
    return [];
  }

  return (data || []).map((booking) => {
    // athletes comes back as an object from the !inner join
    const athlete = booking.athletes as unknown as { id: string; name: string } | null;
    const sessionType = booking.session_types as unknown as { name: string } | null;
    return {
      id: booking.id,
      start_time: booking.start_time,
      status: booking.status,
      duration_minutes: booking.duration_minutes,
      athlete_name: athlete?.name || 'Unknown',
      session_type_name: sessionType?.name || null,
    };
  });
}

async function getDashboardStats(supabase: Awaited<ReturnType<typeof createClient>>): Promise<DashboardStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    invoiceRevenueResult,
    sessionCreditsRevenueResult,
    activeSubscriptionsResult,
    clientsResult,
    weekSessionsResult,
    todaySessionsResult,
    outstandingResult,
  ] = await Promise.all([
    // Revenue from paid invoices this month
    supabase
      .from('invoices')
      .select('total_cents')
      .eq('status', 'paid')
      .gte('paid_at', startOfMonth.toISOString()),

    // Revenue from session credit purchases this month
    supabase
      .from('session_credits')
      .select('price_cents')
      .gte('purchased_at', startOfMonth.toISOString()),

    // Active subscriptions for MRR calculation
    supabase
      .from('subscriptions')
      .select('tier')
      .eq('status', 'active'),

    supabase
      .from('athletes')
      .select('parent_id')
      .eq('is_active', true),

    supabase
      .from('bookings')
      .select('id')
      .gte('start_time', startOfWeek.toISOString())
      .in('status', ['confirmed', 'pending', 'completed']),

    supabase
      .from('bookings')
      .select('id')
      .gte('start_time', today.toISOString())
      .lt('start_time', tomorrow.toISOString())
      .in('status', ['confirmed', 'pending', 'completed']),

    supabase
      .from('invoices')
      .select('total_cents')
      .in('status', ['draft', 'sent', 'overdue']),
  ]);

  // Calculate total revenue this month (invoices + session credit purchases)
  const invoiceRevenue = invoiceRevenueResult.data?.reduce((sum, inv) => sum + (inv.total_cents || 0), 0) || 0;
  const creditRevenue = sessionCreditsRevenueResult.data?.reduce((sum, c) => sum + (c.price_cents || 0), 0) || 0;
  const revenueThisMonth = invoiceRevenue + creditRevenue;

  // Calculate MRR from active subscriptions
  const mrr = activeSubscriptionsResult.data?.reduce((sum, sub) => {
    const tier = sub.tier as SubscriptionTier | null;
    if (tier && STRIPE_PRODUCTS.subscriptions[tier]) {
      return sum + STRIPE_PRODUCTS.subscriptions[tier].price;
    }
    return sum;
  }, 0) || 0;

  const uniqueParentIds = new Set(clientsResult.data?.map((a) => a.parent_id) || []);
  const activeClients = uniqueParentIds.size;
  const sessionsThisWeek = weekSessionsResult.data?.length || 0;
  const sessionsToday = todaySessionsResult.data?.length || 0;
  const outstandingInvoices = {
    count: outstandingResult.data?.length || 0,
    totalCents: outstandingResult.data?.reduce((sum, inv) => sum + (inv.total_cents || 0), 0) || 0,
  };

  return {
    revenueThisMonth,
    mrr,
    activeClients,
    sessionsThisWeek,
    sessionsToday,
    outstandingInvoices,
  };
}

async function getRecentActivity(supabase: Awaited<ReturnType<typeof createClient>>): Promise<ActivityItem[]> {
  const activities: ActivityItem[] = [];

  const [completedSessions, recentPayments, recentBookings, recentNotes] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, updated_at, athletes!inner(name)')
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
      .limit(5),

    supabase
      .from('invoices')
      .select('id, paid_at, total_cents, profiles!inner(full_name)')
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })
      .limit(5),

    supabase
      .from('bookings')
      .select('id, created_at, athletes!inner(name)')
      .in('status', ['confirmed', 'pending'])
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('session_notes')
      .select('id, created_at, athletes!inner(name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (completedSessions.data) {
    for (const session of completedSessions.data) {
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

  if (recentPayments.data) {
    for (const payment of recentPayments.data) {
      const profile = payment.profiles as unknown as { full_name: string | null } | null;
      const clientName = profile?.full_name || 'Unknown';
      const amount = (payment.total_cents / 100).toFixed(0);
      activities.push({
        type: 'payment_received',
        timestamp: payment.paid_at!,
        description: `Payment received - ${clientName} ($${amount})`,
        entityId: payment.id,
      });
    }
  }

  if (recentBookings.data) {
    for (const booking of recentBookings.data) {
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

  if (recentNotes.data) {
    for (const note of recentNotes.data) {
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

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return activities.slice(0, 10);
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Fetch all data in parallel
  const [todaySessions, stats, activities] = await Promise.all([
    getTodaySessions(supabase),
    getDashboardStats(supabase),
    getRecentActivity(supabase),
  ]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Welcome back, Coach!
        </h1>
        <p className="text-neutral-400 mt-1">
          Here&apos;s your daily overview
        </p>
      </div>

      <AdminDashboard
        initialSessions={todaySessions}
        initialStats={stats}
        initialActivities={activities}
      />
    </div>
  );
}
