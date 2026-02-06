'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@m3noover/ui';
import { STRIPE_PRODUCTS, type SubscriptionTier, type OneTimePurchase } from '@/lib/stripe/products';
import { formatAmountForDisplay } from '@/lib/format';

interface Subscription {
  id: string;
  tier: SubscriptionTier | null;
  status: string;
  stripe_subscription_id: string | null;
}

interface SessionCredits {
  total_sessions: number;
  used_sessions: number;
}

const TIER_ORDER: SubscriptionTier[] = ['starter', 'foundation', 'competitor', 'elite'];

const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  starter: ['1 session per week', 'Personalized training', 'Progress tracking'],
  foundation: ['2 sessions per week', 'Personalized training', 'Progress tracking', 'Priority booking'],
  competitor: ['3 sessions per week', 'Personalized training', 'Progress tracking', 'Priority booking', 'Video analysis'],
  elite: ['Unlimited sessions', 'Personalized training', 'Progress tracking', 'Priority booking', 'Video analysis', 'Nutrition guidance'],
};

const TIER_TAGS: Partial<Record<SubscriptionTier, { label: string; color: string }>> = {
  foundation: { label: 'Most Popular', color: 'bg-secondary-500 text-white' },
  elite: { label: 'Best Value', color: 'bg-accent-500 text-black' },
};

const PACK_SAVINGS: Record<OneTimePurchase, string | null> = {
  dropIn: null,
  fivePack: 'Save $140',
  tenPack: 'Save $300',
};

export default function PackagesPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [credits, setCredits] = useState<SessionCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Fetch subscription
        const subRes = await fetch('/api/subscriptions/current');
        if (subRes.ok) {
          const data = await subRes.json();
          setSubscription(data.subscription);
        }

        // Fetch session credits
        const creditsRes = await fetch('/api/session-credits');
        if (creditsRes.ok) {
          const data = await creditsRes.json();
          setCredits(data);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  const handleSubscribe = async (tier: SubscriptionTier) => {
    const product = STRIPE_PRODUCTS.subscriptions[tier];
    setPurchaseLoading(tier);

    try {
      const res = await fetch('/api/stripe/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: product.priceId,
          tier,
        }),
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
      alert('Something went wrong. Please try again.');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const handleBuyPack = async (packKey: OneTimePurchase) => {
    const product = STRIPE_PRODUCTS.oneTime[packKey];
    const typeMap: Record<OneTimePurchase, string> = {
      dropIn: 'drop_in',
      fivePack: 'five_pack',
      tenPack: 'ten_pack',
    };

    setPurchaseLoading(packKey);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: product.priceId,
          type: typeMap[packKey],
        }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to start checkout');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const isCurrentTier = (tier: SubscriptionTier) => {
    return subscription?.tier === tier && subscription.status === 'active';
  };

  const hasActiveSubscription = subscription?.status === 'active';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-10 pb-10">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">Training Plans</h1>
        <p className="text-neutral-400 max-w-2xl mx-auto">
          Choose a plan that fits your training goals. All plans include personalized coaching from Coach Chuck.
        </p>
      </div>

      {/* Current Subscription Banner */}
      {hasActiveSubscription && subscription.tier && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-accent-500/10 border border-accent-500/30 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-500/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">
                Active: {STRIPE_PRODUCTS.subscriptions[subscription.tier].name}
              </p>
              <p className="text-sm text-neutral-400">
                {formatAmountForDisplay(STRIPE_PRODUCTS.subscriptions[subscription.tier].price)}/month
              </p>
            </div>
          </div>
          <Link href="/billing">
            <Button variant="outline" size="sm">
              Manage Plan
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Monthly Training Plans */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-6">Monthly Training Plans</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {TIER_ORDER.map((tier) => {
            const product = STRIPE_PRODUCTS.subscriptions[tier];
            const features = TIER_FEATURES[tier];
            const tag = TIER_TAGS[tier];
            const isCurrent = isCurrentTier(tier);
            const isLoading = purchaseLoading === tier;

            return (
              <motion.div
                key={tier}
                variants={cardVariants}
                className={`relative bg-charcoal-900 rounded-2xl p-6 border-2 transition-all ${
                  isCurrent
                    ? 'border-accent-500 shadow-lg shadow-accent-500/10'
                    : tag
                    ? 'border-charcoal-700 hover:border-charcoal-600'
                    : 'border-charcoal-800 hover:border-charcoal-700'
                }`}
              >
                {/* Tag */}
                {(tag || isCurrent) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ${
                        isCurrent ? 'bg-accent-500 text-black' : tag?.color
                      }`}
                    >
                      {isCurrent ? 'Current Plan' : tag?.label}
                    </span>
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="text-xl font-bold text-white mb-1 mt-2">{product.name}</h3>
                <p className="text-neutral-400 text-sm mb-4">{product.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">
                    {formatAmountForDisplay(product.price)}
                  </span>
                  <span className="text-neutral-500">/mo</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-neutral-300">
                      <svg className="w-4 h-4 text-accent-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : hasActiveSubscription ? (
                  <Button variant="outline" className="w-full" disabled>
                    Contact to Change
                  </Button>
                ) : (
                  <Button
                    variant={tag ? 'secondary' : 'primary'}
                    className="w-full"
                    onClick={() => handleSubscribe(tier)}
                    isLoading={isLoading}
                    disabled={loading || !!purchaseLoading}
                  >
                    Subscribe
                  </Button>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Session Packs */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-2">Session Packs & Drop-ins</h2>
        <p className="text-neutral-400 text-sm mb-6">
          No commitment required. Perfect for trying out training or supplementing your plan.
        </p>

        {/* Show remaining credits if any */}
        {credits && credits.total_sessions - credits.used_sessions > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-charcoal-900 border border-charcoal-800 rounded-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-neutral-400 text-sm">Your Session Credits</span>
              <span className="text-white font-semibold">
                {credits.total_sessions - credits.used_sessions} remaining
              </span>
            </div>
            <div className="w-full bg-charcoal-700 rounded-full h-2">
              <div
                className="bg-accent-500 h-2 rounded-full transition-all"
                style={{
                  width: `${((credits.total_sessions - credits.used_sessions) / credits.total_sessions) * 100}%`,
                }}
              />
            </div>
          </motion.div>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {(['dropIn', 'fivePack', 'tenPack'] as OneTimePurchase[]).map((packKey) => {
            const product = STRIPE_PRODUCTS.oneTime[packKey];
            const savings = PACK_SAVINGS[packKey];
            const isLoading = purchaseLoading === packKey;
            const pricePerSession = Math.round(product.price / product.sessions);

            return (
              <motion.div
                key={packKey}
                variants={cardVariants}
                className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-5 hover:border-charcoal-700 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                    <p className="text-neutral-400 text-sm">{product.description}</p>
                  </div>
                  {savings && (
                    <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded">
                      {savings}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold text-white">
                    {formatAmountForDisplay(product.price)}
                  </span>
                  {product.sessions > 1 && (
                    <span className="text-neutral-500 text-sm">
                      ({formatAmountForDisplay(pricePerSession)}/session)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-neutral-300 mb-4">
                  <svg className="w-4 h-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {product.sessions} {product.sessions === 1 ? 'session' : 'sessions'}
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleBuyPack(packKey)}
                  isLoading={isLoading}
                  disabled={loading || !!purchaseLoading}
                >
                  Buy Now
                </Button>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* FAQ or Note */}
      <section className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Questions?</h3>
        <p className="text-neutral-400 text-sm mb-4">
          Not sure which plan is right for you? Contact Coach Chuck for a free consultation to discuss your training goals.
        </p>
        <Link href="/contact">
          <Button variant="ghost" size="sm">
            Get in Touch →
          </Button>
        </Link>
      </section>
    </div>
  );
}
