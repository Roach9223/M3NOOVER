'use client';

import { formatAmountForDisplay } from '@/lib/format';
import { STRIPE_PRODUCTS, type SubscriptionTier } from '@/lib/stripe/products';
import type { Subscription } from '@/types/payment';

interface SubscriptionTableProps {
  subscriptions: Subscription[];
}

export function SubscriptionTable({ subscriptions }: SubscriptionTableProps) {
  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-400',
    past_due: 'bg-yellow-500/10 text-yellow-400',
    cancelled: 'bg-neutral-500/10 text-neutral-500',
    paused: 'bg-blue-500/10 text-blue-400',
  };

  if (subscriptions.length === 0) {
    return (
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-12 text-center">
        <svg className="w-12 h-12 mx-auto text-neutral-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <p className="text-neutral-400">No subscriptions yet</p>
        <p className="text-neutral-500 text-sm mt-1">Subscriptions will appear here when clients sign up</p>
      </div>
    );
  }

  return (
    <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-charcoal-800">
              <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Client</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Package</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Amount</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Status</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Renews</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="border-b border-charcoal-800 last:border-0 hover:bg-charcoal-800/50">
                <td className="px-6 py-4">
                  <p className="text-white font-medium">
                    {sub.parent?.full_name || 'Unknown'}
                  </p>
                </td>
                <td className="px-6 py-4">
                  {(() => {
                    const tierKey = sub.tier as SubscriptionTier | undefined;
                    const product = tierKey ? STRIPE_PRODUCTS.subscriptions[tierKey] : null;
                    const sessionsPerWeek = sub.sessions_per_week ?? product?.sessionsPerWeek;
                    return (
                      <>
                        <p className="text-white">{product?.name || sub.package?.name || 'Unknown'}</p>
                        {sessionsPerWeek !== null && sessionsPerWeek !== undefined && sessionsPerWeek > 0 && (
                          <p className="text-sm text-neutral-500">
                            {sessionsPerWeek}x/week
                          </p>
                        )}
                        {sessionsPerWeek === -1 && (
                          <p className="text-sm text-neutral-500">Unlimited</p>
                        )}
                      </>
                    );
                  })()}
                </td>
                <td className="px-6 py-4">
                  {(() => {
                    const tierKey = sub.tier as SubscriptionTier | undefined;
                    const product = tierKey ? STRIPE_PRODUCTS.subscriptions[tierKey] : null;
                    const price = product?.price ?? sub.package?.price_cents;
                    return (
                      <p className="text-white font-semibold">
                        {price ? formatAmountForDisplay(price) : '—'}
                        <span className="text-neutral-500 font-normal">/mo</span>
                      </p>
                    );
                  })()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[sub.status]}`}>
                    {sub.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-neutral-400">
                  {sub.current_period_end
                    ? new Date(sub.current_period_end).toLocaleDateString()
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
