import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ClientList } from '@/components/admin/ClientList';
import type { ClientData } from '@/components/admin/ClientRow';
import type { SubscriptionTier } from '@/lib/stripe/products';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Clients',
};

async function getClients(supabase: Awaited<ReturnType<typeof createClient>>): Promise<ClientData[]> {
  // Get all profiles that have athletes (parents)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      stripe_customer_id,
      athletes(id, name, is_active)
    `)
    .eq('role', 'parent');

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return [];
  }

  // Get outstanding invoices per client
  const { data: invoices } = await supabase
    .from('invoices')
    .select('client_id, total_cents, status')
    .in('status', ['draft', 'sent', 'overdue']);

  // Get subscriptions with tier info
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('parent_id, status, tier')
    .in('status', ['active', 'past_due']);

  // Get session credits per user
  const { data: sessionCredits } = await supabase
    .from('session_credits')
    .select('profile_id, total_sessions, used_sessions')
    .or('expires_at.is.null,expires_at.gt.now()');

  // Map outstanding balances
  const balanceByClient: Record<string, number> = {};
  if (invoices) {
    for (const invoice of invoices) {
      if (!balanceByClient[invoice.client_id]) {
        balanceByClient[invoice.client_id] = 0;
      }
      balanceByClient[invoice.client_id] += invoice.total_cents || 0;
    }
  }

  // Map subscription info (tier and status)
  const subscriptionByUser: Record<string, { status: string; tier: SubscriptionTier | null }> = {};
  if (subscriptions) {
    for (const sub of subscriptions) {
      // Only keep the most recent active subscription per user
      if (!subscriptionByUser[sub.parent_id] || sub.status === 'active') {
        subscriptionByUser[sub.parent_id] = {
          status: sub.status,
          tier: sub.tier as SubscriptionTier | null,
        };
      }
    }
  }

  // Map session credits (aggregate per user)
  const creditsByUser: Record<string, number> = {};
  if (sessionCredits) {
    for (const credit of sessionCredits) {
      const remaining = credit.total_sessions - credit.used_sessions;
      if (remaining > 0) {
        if (!creditsByUser[credit.profile_id]) {
          creditsByUser[credit.profile_id] = 0;
        }
        creditsByUser[credit.profile_id] += remaining;
      }
    }
  }

  // Filter to only profiles that have at least one athlete
  const clientsWithAthletes = (profiles || []).filter(
    (p) => p.athletes && (p.athletes as unknown[]).length > 0
  );

  return clientsWithAthletes.map((profile) => ({
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email || '',
    stripe_customer_id: profile.stripe_customer_id || null,
    athletes: (profile.athletes as { id: string; name: string; is_active: boolean }[]) || [],
    outstanding_balance: balanceByClient[profile.id] || 0,
    subscription_status: subscriptionByUser[profile.id]?.status || null,
    subscription_tier: subscriptionByUser[profile.id]?.tier || null,
    session_credits: creditsByUser[profile.id] || 0,
  }));
}

export default async function ClientsPage() {
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

  const clients = await getClients(supabase);

  return <ClientList clients={clients} />;
}
