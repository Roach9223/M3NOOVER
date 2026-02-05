import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { InvoiceCard } from '@/components/billing/InvoiceCard';
import { SubscriptionBadge } from '@/components/billing/SubscriptionBadge';

export const metadata = {
  title: 'Billing',
};

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      *,
      items:invoice_items(*)
    `)
    .eq('parent_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch user's subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      *,
      package:packages(*)
    `)
    .eq('parent_id', user.id)
    .eq('status', 'active')
    .single();

  const pendingInvoices = invoices?.filter((inv) => inv.status === 'pending') || [];
  const paidInvoices = invoices?.filter((inv) => inv.status === 'paid') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Billing</h1>
          <p className="text-neutral-400 mt-1">Manage your invoices and payments</p>
        </div>
        <Link
          href="/packages"
          className="text-accent-500 hover:text-accent-400 text-sm font-medium"
        >
          View Packages →
        </Link>
      </div>

      {/* Active Subscription */}
      {subscription && (
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Active Subscription</h2>
              <p className="text-neutral-400">{subscription.package?.name}</p>
            </div>
            <SubscriptionBadge subscription={subscription} />
          </div>
        </div>
      )}

      {/* Pending Invoices */}
      {pendingInvoices.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Pending Payment</h2>
          <div className="space-y-4">
            {pendingInvoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} showPayButton />
            ))}
          </div>
        </div>
      )}

      {/* No Pending Invoices */}
      {pendingInvoices.length === 0 && (
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-white font-medium">You&apos;re all caught up!</p>
          <p className="text-neutral-400 text-sm mt-1">No pending invoices</p>
        </div>
      )}

      {/* Payment History */}
      {paidInvoices.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Payment History</h2>
          <div className="space-y-4">
            {paidInvoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
