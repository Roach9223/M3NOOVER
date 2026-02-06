import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@m3noover/ui';
import { formatAmountForDisplay } from '@/lib/format';
import { STRIPE_PRODUCTS, type SubscriptionTier } from '@/lib/stripe/products';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Client Details',
};

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

interface ClientDetails {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  athletes: {
    id: string;
    name: string;
    is_active: boolean;
    date_of_birth: string | null;
    sports: string[] | null;
    school: string | null;
  }[];
  subscription: {
    id: string;
    tier: SubscriptionTier;
    status: string;
    sessions_per_week: number | null;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  } | null;
  session_credits: {
    total: number;
    used: number;
    available: number;
    packs: {
      product_type: string;
      total_sessions: number;
      used_sessions: number;
      purchased_at: string;
      expires_at: string | null;
    }[];
  };
  outstanding_balance: number;
  recent_bookings: {
    id: string;
    start_time: string;
    status: string;
    session_type_name: string | null;
  }[];
}

async function getClientDetails(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: string
): Promise<ClientDetails | null> {
  // Get profile with athletes
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      phone,
      stripe_customer_id,
      created_at,
      athletes(id, name, is_active, date_of_birth, sports, school)
    `)
    .eq('id', clientId)
    .eq('role', 'parent')
    .single();

  if (profileError || !profile) {
    return null;
  }

  // Get subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, tier, status, sessions_per_week, current_period_start, current_period_end, cancel_at_period_end')
    .eq('parent_id', clientId)
    .in('status', ['active', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Get session credits
  const { data: credits } = await supabase
    .from('session_credits')
    .select('product_type, total_sessions, used_sessions, purchased_at, expires_at')
    .eq('profile_id', clientId)
    .or('expires_at.is.null,expires_at.gt.now()');

  // Calculate credit totals
  const creditPacks = credits || [];
  const totalCredits = creditPacks.reduce((sum, c) => sum + c.total_sessions, 0);
  const usedCredits = creditPacks.reduce((sum, c) => sum + c.used_sessions, 0);
  const availableCredits = creditPacks.reduce(
    (sum, c) => sum + Math.max(0, c.total_sessions - c.used_sessions),
    0
  );

  // Get outstanding invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('total_cents')
    .eq('client_id', clientId)
    .in('status', ['draft', 'sent', 'overdue']);

  const outstandingBalance = invoices?.reduce((sum, inv) => sum + (inv.total_cents || 0), 0) || 0;

  // Get recent bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, start_time, status, session_types(name)')
    .eq('parent_id', clientId)
    .order('start_time', { ascending: false })
    .limit(5);

  return {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    stripe_customer_id: profile.stripe_customer_id,
    created_at: profile.created_at,
    athletes: (profile.athletes as ClientDetails['athletes']) || [],
    subscription: subscription
      ? {
          id: subscription.id,
          tier: subscription.tier as SubscriptionTier,
          status: subscription.status,
          sessions_per_week: subscription.sessions_per_week,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
        }
      : null,
    session_credits: {
      total: totalCredits,
      used: usedCredits,
      available: availableCredits,
      packs: creditPacks,
    },
    outstanding_balance: outstandingBalance,
    recent_bookings: (bookings || []).map((b) => ({
      id: b.id,
      start_time: b.start_time,
      status: b.status,
      session_type_name: (b.session_types as { name: string } | { name: string }[] | null)
        ? (Array.isArray(b.session_types) ? b.session_types[0]?.name : (b.session_types as { name: string })?.name)
        : null,
    })),
  };
}

const TIER_BADGE_COLORS: Record<SubscriptionTier, { bg: string; text: string }> = {
  starter: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
  foundation: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  competitor: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  elite: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
};

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params;
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

  const client = await getClientDetails(supabase, id);

  if (!client) {
    notFound();
  }

  const activeAthletes = client.athletes.filter((a) => a.is_active);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/clients">
            <Button variant="ghost" size="sm">
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">
              {client.full_name || 'Unknown Client'}
            </h1>
            <p className="text-neutral-400 mt-1">{client.email}</p>
          </div>
        </div>

        {/* Stripe Link */}
        {client.stripe_customer_id && (
          <a
            href={`https://dashboard.stripe.com/customers/${client.stripe_customer_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-[#635bff]/20 hover:bg-[#635bff]/30 text-[#635bff] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
            </svg>
            View in Stripe
          </a>
        )}
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription Card */}
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Subscription</h2>

          {client.subscription ? (
            <div className="space-y-4">
              {/* Plan Badge */}
              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    TIER_BADGE_COLORS[client.subscription.tier].bg
                  } ${TIER_BADGE_COLORS[client.subscription.tier].text}`}
                >
                  {STRIPE_PRODUCTS.subscriptions[client.subscription.tier].name}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    client.subscription.status === 'active'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {client.subscription.status}
                </span>
              </div>

              {/* Price */}
              <div>
                <p className="text-2xl font-bold text-white">
                  {formatAmountForDisplay(STRIPE_PRODUCTS.subscriptions[client.subscription.tier].price)}
                  <span className="text-sm font-normal text-neutral-400">/mo</span>
                </p>
              </div>

              {/* Sessions per week */}
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Sessions/Week</span>
                <span className="text-white">
                  {client.subscription.sessions_per_week === null ||
                  client.subscription.sessions_per_week === -1
                    ? 'Unlimited'
                    : client.subscription.sessions_per_week}
                </span>
              </div>

              {/* Next billing */}
              {client.subscription.current_period_end && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Next Billing</span>
                  <span className="text-white">
                    {new Date(client.subscription.current_period_end).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}

              {/* Cancel status */}
              {client.subscription.cancel_at_period_end && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-yellow-400 text-sm">Cancels at period end</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto mb-3 bg-neutral-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-neutral-400 text-sm">No active subscription</p>
            </div>
          )}
        </div>

        {/* Session Credits Card */}
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Session Credits</h2>

          {client.session_credits.available > 0 ? (
            <div className="space-y-4">
              {/* Available count */}
              <div className="text-center">
                <p className="text-4xl font-bold text-accent-500">
                  {client.session_credits.available}
                </p>
                <p className="text-neutral-400 text-sm">credits available</p>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Used: {client.session_credits.used}</span>
                  <span>Total: {client.session_credits.total}</span>
                </div>
                <div className="w-full bg-charcoal-700 rounded-full h-2">
                  <div
                    className="bg-accent-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${(client.session_credits.available / client.session_credits.total) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Packs list */}
              {client.session_credits.packs.length > 0 && (
                <div className="space-y-2 pt-2">
                  {client.session_credits.packs
                    .filter((p) => p.total_sessions - p.used_sessions > 0)
                    .map((pack, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-sm p-2 bg-charcoal-800/50 rounded"
                      >
                        <span className="text-neutral-300 capitalize">
                          {pack.product_type.replace('_', ' ')}
                        </span>
                        <span className="text-accent-400">
                          {pack.total_sessions - pack.used_sessions} left
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto mb-3 bg-neutral-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-neutral-400 text-sm">No session credits</p>
            </div>
          )}
        </div>

        {/* Account Info Card */}
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Account Info</h2>

          <div className="space-y-4">
            {/* Contact */}
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Contact</p>
              <p className="text-white">{client.email}</p>
              {client.phone && <p className="text-neutral-400">{client.phone}</p>}
            </div>

            {/* Member since */}
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Member Since</p>
              <p className="text-white">
                {new Date(client.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>

            {/* Outstanding balance */}
            {client.outstanding_balance > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-neutral-400 mb-1">Outstanding Balance</p>
                <p className="text-red-400 font-semibold">
                  {formatAmountForDisplay(client.outstanding_balance)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Athletes */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Athletes</h2>
          <span className="text-neutral-400 text-sm">
            {activeAthletes.length} active
          </span>
        </div>

        {activeAthletes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAthletes.map((athlete) => (
              <div
                key={athlete.id}
                className="p-4 bg-charcoal-800/50 rounded-lg"
              >
                <p className="text-white font-medium">{athlete.name}</p>
                {athlete.school && (
                  <p className="text-neutral-400 text-sm">{athlete.school}</p>
                )}
                {athlete.sports && athlete.sports.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {athlete.sports.map((sport) => (
                      <span
                        key={sport}
                        className="text-xs px-2 py-0.5 bg-accent-500/20 text-accent-400 rounded"
                      >
                        {sport}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-400 text-center py-4">No active athletes</p>
        )}
      </div>

      {/* Recent Bookings */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Sessions</h2>

        {client.recent_bookings.length > 0 ? (
          <div className="space-y-2">
            {client.recent_bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 bg-charcoal-800/50 rounded-lg"
              >
                <div>
                  <p className="text-white">
                    {new Date(booking.start_time).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    at{' '}
                    {new Date(booking.start_time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                  {booking.session_type_name && (
                    <p className="text-neutral-400 text-sm">{booking.session_type_name}</p>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    booking.status === 'completed'
                      ? 'bg-green-500/20 text-green-400'
                      : booking.status === 'confirmed'
                      ? 'bg-blue-500/20 text-blue-400'
                      : booking.status === 'cancelled'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-neutral-500/20 text-neutral-400'
                  }`}
                >
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-400 text-center py-4">No sessions yet</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href={`/admin/invoices/new?client=${client.id}`}>
          <Button variant="outline">Create Invoice</Button>
        </Link>
        <Link href={`/admin/schedule/quick-book?client=${client.id}`}>
          <Button variant="outline">Quick Book Session</Button>
        </Link>
      </div>
    </div>
  );
}
