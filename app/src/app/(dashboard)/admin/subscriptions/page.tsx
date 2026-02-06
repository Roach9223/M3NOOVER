import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SubscriptionTable } from '@/components/admin/SubscriptionTable';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Subscriptions',
};

export default async function AdminSubscriptionsPage() {
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

  // Fetch subscriptions
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select(`
      *,
      package:packages(*),
      parent:profiles!parent_id(id, full_name)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Subscriptions</h1>
        <p className="text-neutral-400 mt-1">Manage active subscriptions</p>
      </div>

      {/* Subscriptions Table */}
      <SubscriptionTable subscriptions={subscriptions || []} />
    </div>
  );
}
