import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ClientList } from '@/components/admin/ClientList';
import type { ClientData } from '@/components/admin/ClientRow';

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

  // Get subscriptions
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('user_id, status');

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

  // Map subscription statuses
  const subscriptionByUser: Record<string, string> = {};
  if (subscriptions) {
    for (const sub of subscriptions) {
      subscriptionByUser[sub.user_id] = sub.status;
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
    athletes: (profile.athletes as { id: string; name: string; is_active: boolean }[]) || [],
    outstanding_balance: balanceByClient[profile.id] || 0,
    subscription_status: subscriptionByUser[profile.id] || null,
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
