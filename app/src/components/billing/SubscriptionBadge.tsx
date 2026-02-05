'use client';

import { formatAmountForDisplay } from '@/lib/format';
import type { Subscription } from '@/types/payment';

interface SubscriptionBadgeProps {
  subscription: Subscription;
}

export function SubscriptionBadge({ subscription }: SubscriptionBadgeProps) {
  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-400 border-green-500/20',
    past_due: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    cancelled: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
    paused: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  return (
    <div className={`px-4 py-2 rounded-lg border ${statusColors[subscription.status]}`}>
      <div className="flex items-center gap-4">
        <div>
          <p className="font-semibold">
            {subscription.package
              ? formatAmountForDisplay(subscription.package.price_cents)
              : '—'}
            <span className="text-sm font-normal opacity-75">/mo</span>
          </p>
        </div>
        {subscription.current_period_end && (
          <div className="text-sm opacity-75">
            Renews {new Date(subscription.current_period_end).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}
