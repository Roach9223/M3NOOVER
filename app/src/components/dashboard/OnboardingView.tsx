'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@m3noover/ui';
import { staggerContainer, staggerItem, scaleIn, transitions } from '@/lib/animations';
import { STRIPE_PRODUCTS } from '@/lib/stripe/products';

interface OnboardingStep {
  id: string;
  number: number;
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
  isComplete: boolean;
  isLocked: boolean;
  lockReason?: string;
}

interface OnboardingViewProps {
  firstName: string;
  hasSubscriptionOrCredits: boolean;
  hasAthletes: boolean;
  hasBookings: boolean;
}

// Format cents to dollars
function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function OnboardingView({
  firstName,
  hasSubscriptionOrCredits,
  hasAthletes,
  hasBookings,
}: OnboardingViewProps) {
  const router = useRouter();

  // Build the steps with completion and lock status
  const steps: OnboardingStep[] = [
    {
      id: 'plan',
      number: 1,
      title: 'Choose Your Training Plan',
      description: 'Pick a monthly plan or grab a session pack to get started',
      href: '/packages',
      buttonLabel: 'View Plans',
      isComplete: hasSubscriptionOrCredits,
      isLocked: false,
    },
    {
      id: 'athlete',
      number: 2,
      title: 'Add a Trainee',
      description: 'Tell us who will be training so Coach Chuck can personalize their sessions',
      href: '/athletes/new',
      buttonLabel: 'Add Trainee',
      isComplete: hasAthletes,
      isLocked: !hasSubscriptionOrCredits,
      lockReason: 'Complete Step 1 first',
    },
    {
      id: 'book',
      number: 3,
      title: 'Book Your First Session',
      description: 'Pick a time that works for you',
      href: '/schedule/book',
      buttonLabel: 'Book Session',
      isComplete: hasBookings,
      isLocked: !hasAthletes,
      lockReason: 'Complete Step 2 first',
    },
  ];

  const completedCount = steps.filter((s) => s.isComplete).length;
  const allComplete = completedCount === steps.length;

  // Handle skip - set cookie and redirect
  const handleSkip = () => {
    // Set cookie to remember skip preference (expires in 7 days)
    document.cookie = 'm3_onboarding_skipped=true; path=/; max-age=604800; SameSite=Lax';
    router.push('/dashboard?skip_onboarding=true');
  };

  // Get ordered subscription plans for preview
  const planOrder = ['starter', 'foundation', 'competitor', 'elite'] as const;
  const plans = planOrder.map((key) => ({
    key,
    ...STRIPE_PRODUCTS.subscriptions[key],
  }));

  return (
    <motion.div
      className="max-w-3xl mx-auto space-y-8"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Welcome Header */}
      <motion.div variants={staggerItem} transition={transitions.normal} className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-accent-500/20 to-accent-600/10 rounded-full flex items-center justify-center"
        >
          <svg
            className="w-10 h-10 text-accent-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </motion.div>
        <h1 className="text-3xl lg:text-4xl font-bold text-white">
          Welcome to M3 Training{firstName && `, ${firstName}`}!
        </h1>
        <p className="text-neutral-400 mt-3 text-lg">
          Let&apos;s get you set up in just a few steps
        </p>
      </motion.div>

      {/* Progress Bar */}
      <motion.div variants={staggerItem} transition={transitions.normal}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-400">
            {completedCount} of {steps.length} steps complete
          </span>
          <span className="text-sm text-accent-500 font-medium">
            {Math.round((completedCount / steps.length) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-charcoal-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-accent-500 to-accent-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / steps.length) * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
      </motion.div>

      {/* Steps */}
      <motion.div variants={staggerItem} transition={transitions.normal} className="space-y-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            variants={scaleIn}
            transition={{ ...transitions.normal, delay: 0.1 * index }}
            className={`relative overflow-hidden rounded-xl border transition-all ${
              step.isComplete
                ? 'bg-green-500/5 border-green-500/30'
                : step.isLocked
                  ? 'bg-charcoal-900/50 border-charcoal-800 opacity-60'
                  : 'bg-charcoal-900 border-charcoal-800 hover:border-accent-500/50'
            }`}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                {/* Step Number / Checkmark */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    step.isComplete
                      ? 'bg-green-500 text-white'
                      : step.isLocked
                        ? 'bg-charcoal-800 text-neutral-500'
                        : 'bg-accent-500/20 text-accent-500'
                  }`}
                >
                  {step.isComplete ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-lg font-semibold ${
                        step.isComplete
                          ? 'text-green-400'
                          : step.isLocked
                            ? 'text-neutral-500'
                            : 'text-white'
                      }`}
                    >
                      {step.title}
                    </h3>
                    {step.isComplete && (
                      <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                        Complete
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-1 ${step.isLocked ? 'text-neutral-600' : 'text-neutral-400'}`}
                  >
                    {step.description}
                  </p>

                  {/* Action Button */}
                  <div className="mt-4">
                    {step.isComplete ? (
                      <Link href={step.href}>
                        <Button variant="ghost" size="sm">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                          Edit
                        </Button>
                      </Link>
                    ) : step.isLocked ? (
                      <Button variant="secondary" size="sm" disabled>
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        {step.lockReason}
                      </Button>
                    ) : (
                      <Link href={step.href}>
                        <Button variant="primary" size="sm">
                          {step.buttonLabel}
                          <svg
                            className="w-4 h-4 ml-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Show plan preview cards in Step 1 if not complete */}
            {step.id === 'plan' && !step.isComplete && (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {plans.map((plan) => (
                    <Link
                      key={plan.key}
                      href="/packages"
                      className="p-3 bg-charcoal-800/50 rounded-lg border border-charcoal-700 hover:border-accent-500/50 transition-colors group"
                    >
                      <p className="text-sm font-semibold text-white group-hover:text-accent-500 transition-colors">
                        {plan.name}
                      </p>
                      <p className="text-lg font-bold text-accent-500 mt-1">
                        {formatPrice(plan.price)}
                        <span className="text-xs text-neutral-500 font-normal">/mo</span>
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {plan.sessionsPerWeek === -1
                          ? 'Unlimited'
                          : `${plan.sessionsPerWeek}x/week`}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* All Complete Message */}
      {allComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="bg-gradient-to-r from-green-500/10 to-accent-500/10 border border-green-500/30 rounded-xl p-6 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">You&apos;re All Set!</h3>
          <p className="text-neutral-400 mb-4">
            Great job completing the setup. Your dashboard is ready.
          </p>
          <Link href="/dashboard?skip_onboarding=true">
            <Button variant="primary">Go to Dashboard</Button>
          </Link>
        </motion.div>
      )}

      {/* Skip Link */}
      {!allComplete && (
        <motion.div
          variants={staggerItem}
          transition={transitions.normal}
          className="text-center pt-4"
        >
          <button
            onClick={handleSkip}
            className="text-neutral-500 hover:text-neutral-400 text-sm transition-colors"
          >
            Skip for now
          </button>
        </motion.div>
      )}

      {/* Help Text */}
      <motion.div
        variants={staggerItem}
        transition={transitions.normal}
        className="text-center text-sm text-neutral-500"
      >
        <p>
          Questions? Text Coach Chuck at{' '}
          <a href="tel:+19515555555" className="text-accent-500 hover:underline">
            (951) 555-5555
          </a>
        </p>
      </motion.div>
    </motion.div>
  );
}
