'use client';

import { useState } from 'react';
import { Button } from '@m3noover/ui';
import { formatAmountForDisplay } from '@/lib/format';
import type { Package } from '@/types/payment';

interface PackageCardProps {
  package: Package;
  isCurrentPlan: boolean;
  hasActiveSubscription: boolean;
}

export function PackageCard({ package: pkg, isCurrentPlan, hasActiveSubscription }: PackageCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/stripe/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: pkg.id }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to start subscription');
      }
    } catch (error) {
      console.error('Subscribe error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isPopular = pkg.name === 'M3 Competitor';

  return (
    <div
      className={`relative bg-charcoal-900 border rounded-xl p-6 ${
        isCurrentPlan
          ? 'border-accent-500'
          : isPopular
          ? 'border-secondary-500'
          : 'border-charcoal-800'
      }`}
    >
      {/* Popular badge */}
      {isPopular && !isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 bg-secondary-500 text-black text-xs font-bold rounded-full">
            MOST POPULAR
          </span>
        </div>
      )}

      {/* Current plan badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 bg-accent-500 text-black text-xs font-bold rounded-full">
            CURRENT PLAN
          </span>
        </div>
      )}

      {/* Package info */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
        <p className="text-neutral-400 text-sm">{pkg.description}</p>
      </div>

      {/* Price */}
      <div className="text-center mb-6">
        <p className="text-4xl font-black text-white">
          {formatAmountForDisplay(pkg.price_cents)}
        </p>
        {pkg.is_recurring && (
          <p className="text-neutral-500 text-sm">/month</p>
        )}
      </div>

      {/* Features */}
      <div className="space-y-3 mb-6">
        {pkg.sessions_per_week && (
          <div className="flex items-center gap-2 text-neutral-300">
            <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{pkg.sessions_per_week} sessions per week</span>
          </div>
        )}
        {!pkg.sessions_per_week && pkg.is_recurring && (
          <div className="flex items-center gap-2 text-neutral-300">
            <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Unlimited sessions</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-neutral-300">
          <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Personalized training</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-300">
          <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Progress tracking</span>
        </div>
      </div>

      {/* CTA */}
      {isCurrentPlan ? (
        <Button variant="outline" className="w-full" disabled>
          Current Plan
        </Button>
      ) : hasActiveSubscription && pkg.is_recurring ? (
        <Button variant="outline" className="w-full" disabled>
          Change Plan
        </Button>
      ) : (
        <Button
          variant={isPopular ? 'secondary' : 'primary'}
          className="w-full"
          onClick={handleSubscribe}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : pkg.is_recurring ? 'Subscribe' : 'Purchase'}
        </Button>
      )}
    </div>
  );
}
