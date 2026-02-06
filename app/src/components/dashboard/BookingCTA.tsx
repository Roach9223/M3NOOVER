'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { STRIPE_PRODUCTS, type SubscriptionTier } from '@/lib/stripe/products';

interface BookingCTAProps {
  subscription: {
    tier: SubscriptionTier;
    sessions_per_week: number | null;
    status: string;
  } | null;
  sessionsThisWeek: number;
  availableCredits: number;
  nextSession: {
    start_time: string;
    session_type_name: string;
  } | null;
}

function formatNextSession(startTime: string): string {
  const date = new Date(startTime);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  if (diffDays === 0) {
    return `Today, ${timeStr}`;
  } else if (diffDays === 1) {
    return `Tomorrow, ${timeStr}`;
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' }) + `, ${timeStr}`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + `, ${timeStr}`;
}

function getTierDisplayName(tier: SubscriptionTier): string {
  return STRIPE_PRODUCTS.subscriptions[tier]?.name || tier;
}

export function BookingCTA({
  subscription,
  sessionsThisWeek,
  availableCredits,
  nextSession,
}: BookingCTAProps) {
  const hasActiveSubscription = subscription?.status === 'active';
  const sessionsPerWeek = subscription?.sessions_per_week ?? 0;
  const isUnlimited = sessionsPerWeek === -1;
  const atWeeklyLimit = !isUnlimited && sessionsThisWeek >= sessionsPerWeek;

  // Determine CTA state
  let heading: string;
  let subtitle: string;
  let buttonText: string;
  let buttonHref: string;

  if (hasActiveSubscription) {
    heading = 'Ready to Train?';
    const tierName = getTierDisplayName(subscription.tier);

    if (isUnlimited) {
      subtitle = `${tierName} Plan - Unlimited sessions`;
    } else if (atWeeklyLimit && availableCredits > 0) {
      subtitle = `${tierName} limit reached. ${availableCredits} credit${availableCredits !== 1 ? 's' : ''} available`;
    } else {
      subtitle = `${tierName} - ${sessionsThisWeek} of ${sessionsPerWeek} sessions used this week`;
    }

    buttonText = 'Book Session';
    buttonHref = '/schedule/book';
  } else if (availableCredits > 0) {
    heading = 'Ready to Train?';
    subtitle = `${availableCredits} session credit${availableCredits !== 1 ? 's' : ''} available`;
    buttonText = 'Book Session';
    buttonHref = '/schedule/book';
  } else {
    heading = 'Get Started';
    subtitle = 'Choose a training plan to begin';
    buttonText = 'View Plans';
    buttonHref = '/packages';
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden bg-gradient-to-r from-charcoal-900 to-charcoal-800 border border-accent-500/20 rounded-2xl p-6"
    >
      {/* Animated accent orb in background */}
      <motion.div
        className="absolute -top-20 -right-20 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">{heading}</h2>
          <p className="text-neutral-400">{subtitle}</p>
          {nextSession && (
            <p className="text-sm text-accent-500">
              Next: {formatNextSession(nextSession.start_time)}
            </p>
          )}
        </div>

        <Link
          href={buttonHref}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {buttonText}
        </Link>
      </div>
    </motion.div>
  );
}
