'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@m3noover/ui';
import { STRIPE_PRODUCTS, type SubscriptionTier } from '@/lib/stripe/products';
import { formatAmountForDisplay, formatDate } from '@/lib/format';

interface Subscription {
  id: string;
  tier: SubscriptionTier | null;
  status: string;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  sessions_per_week: number | null;
}

interface SessionCreditPack {
  total_sessions: number;
  used_sessions: number;
  product_type: string;
  purchased_at: string;
  expires_at: string | null;
}

interface SessionCredits {
  total_sessions: number;
  used_sessions: number;
  available_sessions: number;
  packs: SessionCreditPack[];
}

interface Invoice {
  id: string;
  status: string;
  total_cents: number;
  paid_at: string | null;
  created_at: string;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [credits, setCredits] = useState<SessionCredits | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    async function fetchBillingData() {
      try {
        const [subRes, creditsRes, invoicesRes] = await Promise.all([
          fetch('/api/subscriptions/current'),
          fetch('/api/session-credits'),
          fetch('/api/invoices'),
        ]);

        if (subRes.ok) {
          const data = await subRes.json();
          setSubscription(data.subscription);
        }

        if (creditsRes.ok) {
          const data = await creditsRes.json();
          setCredits(data);
        }

        if (invoicesRes.ok) {
          const data = await invoicesRes.json();
          setInvoices(data);
        }
      } catch (error) {
        console.error('Failed to fetch billing data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBillingData();
  }, []);

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to open billing portal');
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert('Something went wrong');
    } finally {
      setPortalLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-500/10 text-green-400',
      past_due: 'bg-yellow-500/10 text-yellow-400',
      cancelled: 'bg-red-500/10 text-red-400',
      paused: 'bg-neutral-500/10 text-neutral-400',
    };
    return styles[status] || styles.active;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-charcoal-800 rounded animate-pulse" />
        <div className="h-40 bg-charcoal-900 rounded-xl animate-pulse" />
        <div className="h-40 bg-charcoal-900 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Billing</h1>
          <p className="text-neutral-400 mt-1">Manage your subscription and payments</p>
        </div>
        <Link href="/packages">
          <Button variant="outline" size="sm">
            View Plans
          </Button>
        </Link>
      </div>

      {/* Active Subscription */}
      {subscription && subscription.tier ? (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-semibold text-white">
                  {STRIPE_PRODUCTS.subscriptions[subscription.tier].name}
                </h2>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(subscription.status)}`}>
                  {subscription.status === 'active' ? 'Active' : subscription.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-neutral-400">
                {formatAmountForDisplay(STRIPE_PRODUCTS.subscriptions[subscription.tier].price)}/month
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenPortal}
              isLoading={portalLoading}
            >
              Manage Subscription
            </Button>
          </div>

          {/* Subscription Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Sessions */}
            <div className="bg-charcoal-800/50 rounded-lg p-4">
              <p className="text-neutral-400 text-sm mb-1">Sessions per Week</p>
              <p className="text-white text-lg font-semibold">
                {subscription.sessions_per_week === null ? 'Unlimited' : subscription.sessions_per_week}
              </p>
            </div>

            {/* Next Billing */}
            <div className="bg-charcoal-800/50 rounded-lg p-4">
              <p className="text-neutral-400 text-sm mb-1">Next Billing Date</p>
              <p className="text-white text-lg font-semibold">
                {subscription.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>

            {/* Status */}
            <div className="bg-charcoal-800/50 rounded-lg p-4">
              <p className="text-neutral-400 text-sm mb-1">Status</p>
              <p className="text-white text-lg font-semibold">
                {subscription.cancel_at_period_end ? (
                  <span className="text-yellow-400">Cancels at period end</span>
                ) : subscription.status === 'active' ? (
                  <span className="text-green-400">Active</span>
                ) : (
                  subscription.status
                )}
              </p>
            </div>
          </div>
        </motion.section>
      ) : (
        /* No Subscription */
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-8 text-center"
        >
          <div className="w-12 h-12 mx-auto mb-4 bg-charcoal-800 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No Active Subscription</h2>
          <p className="text-neutral-400 mb-6">
            Subscribe to a training plan to get started with regular sessions.
          </p>
          <Link href="/packages">
            <Button variant="primary">View Training Plans</Button>
          </Link>
        </motion.section>
      )}

      {/* Session Credits */}
      {credits && credits.available_sessions > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Session Credits</h2>
            <span className="text-2xl font-bold text-accent-500">
              {credits.available_sessions}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-400">Available</span>
              <span className="text-white">
                {credits.available_sessions} of {credits.total_sessions} sessions
              </span>
            </div>
            <div className="w-full bg-charcoal-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-accent-600 to-accent-400 h-3 rounded-full transition-all"
                style={{
                  width: `${(credits.available_sessions / credits.total_sessions) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Credit Packs */}
          {credits.packs.length > 0 && (
            <div className="space-y-2">
              <p className="text-neutral-400 text-sm">Your Packs</p>
              {credits.packs.map((pack, i) => {
                const remaining = pack.total_sessions - pack.used_sessions;
                if (remaining <= 0) return null;

                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-charcoal-800/50 rounded-lg text-sm"
                  >
                    <div>
                      <span className="text-white capitalize">
                        {pack.product_type.replace('_', ' ')}
                      </span>
                      <span className="text-neutral-500 ml-2">
                        Purchased {new Date(pack.purchased_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-accent-400 font-medium">
                      {remaining} remaining
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-charcoal-800">
            <Link href="/schedule/book">
              <Button variant="primary" size="sm">
                Book a Session
              </Button>
            </Link>
          </div>
        </motion.section>
      )}

      {/* Payment History */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Payment History</h2>
          {subscription?.stripe_subscription_id && (
            <button
              onClick={handleOpenPortal}
              className="text-accent-500 hover:text-accent-400 text-sm font-medium"
            >
              View All in Stripe →
            </button>
          )}
        </div>

        {invoices.length > 0 ? (
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl overflow-hidden">
            <div className="divide-y divide-charcoal-800">
              {invoices.slice(0, 10).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <p className="text-white font-medium">
                      {formatAmountForDisplay(invoice.total_cents)}
                    </p>
                    <p className="text-neutral-400 text-sm">
                      {new Date(invoice.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      invoice.status === 'paid'
                        ? 'bg-green-500/10 text-green-400'
                        : invoice.status === 'pending'
                        ? 'bg-yellow-500/10 text-yellow-400'
                        : 'bg-neutral-500/10 text-neutral-400'
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-8 text-center">
            <p className="text-neutral-400">No payment history yet</p>
          </div>
        )}
      </motion.section>

      {/* Help Section */}
      <section className="bg-charcoal-900/50 border border-charcoal-800 rounded-xl p-6">
        <h3 className="text-white font-medium mb-2">Need Help?</h3>
        <p className="text-neutral-400 text-sm mb-4">
          Questions about your billing or subscription? Contact Coach Chuck directly.
        </p>
        <div className="flex gap-3">
          <a href="mailto:chuck@m3noover.com" className="text-accent-500 hover:text-accent-400 text-sm">
            chuck@m3noover.com
          </a>
          <span className="text-neutral-600">•</span>
          <a href="tel:+19515551234" className="text-accent-500 hover:text-accent-400 text-sm">
            (951) 555-1234
          </a>
        </div>
      </section>
    </div>
  );
}
