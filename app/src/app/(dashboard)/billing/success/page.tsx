'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@m3noover/ui';
import { formatAmountForDisplay } from '@/lib/format';

interface CheckoutSession {
  id: string;
  status: string;
  payment_status: string;
  mode: 'subscription' | 'payment';
  amount_total: number;
  currency: string;
  customer_email: string | null;
  product_name: string;
  product_description: string | null;
  quantity: number;
  created: number;
  metadata: {
    tier?: string;
    type?: string;
    sessions?: string;
  };
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSession() {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/stripe/checkout-session?session_id=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        } else {
          const data = await res.json();
          setError(data.error || 'Failed to load payment details');
        }
      } catch (err) {
        console.error('Failed to fetch checkout session:', err);
        setError('Failed to load payment details');
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [sessionId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-charcoal-800 rounded-full flex items-center justify-center mb-6 animate-pulse" />
          <div className="h-8 w-48 mx-auto bg-charcoal-800 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 mx-auto bg-charcoal-800 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // No session ID or error - show generic success
  if (!sessionId || error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-neutral-400 mb-8">
            Thank you for your payment. A receipt has been sent to your email.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/schedule/book">
              <Button variant="primary">Book a Session</Button>
            </Link>
            <Link href="/billing">
              <Button variant="outline">View Billing</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Determine what was purchased
  const isSubscription = session?.mode === 'subscription';
  const sessionCount = session?.metadata?.sessions ? parseInt(session.metadata.sessions) : null;

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Success Icon */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-6"
          >
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
            {isSubscription ? 'Subscription Activated!' : 'Payment Successful!'}
          </h1>
          <p className="text-neutral-400">
            {isSubscription
              ? 'Your training plan is now active. Time to start booking sessions!'
              : 'Your session credits have been added to your account.'}
          </p>
        </div>

        {/* Order Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6 mb-6"
        >
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4">
            Order Details
          </h2>

          <div className="space-y-4">
            {/* Product */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-semibold">{session?.product_name}</p>
                {session?.product_description && (
                  <p className="text-neutral-400 text-sm">{session.product_description}</p>
                )}
              </div>
              {session?.quantity && session.quantity > 1 && (
                <span className="text-neutral-400 text-sm">x{session.quantity}</span>
              )}
            </div>

            {/* Session Count (for packs) */}
            {sessionCount && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">Sessions Added</span>
                <span className="text-accent-400 font-medium">{sessionCount} sessions</span>
              </div>
            )}

            {/* Subscription Info */}
            {isSubscription && session?.metadata?.tier && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">Plan Type</span>
                <span className="text-white capitalize">{session.metadata.tier}</span>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-charcoal-700 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Total Paid</span>
                <span className="text-xl font-bold text-white">
                  {session?.amount_total
                    ? formatAmountForDisplay(session.amount_total)
                    : '—'}
                </span>
              </div>
            </div>

            {/* Email Confirmation */}
            {session?.customer_email && (
              <p className="text-neutral-500 text-sm text-center pt-2">
                A receipt has been sent to {session.customer_email}
              </p>
            )}
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-3"
        >
          <Link href="/schedule/book" className="w-full">
            <Button variant="primary" className="w-full">
              Book a Session
            </Button>
          </Link>
          <Link href="/schedule" className="w-full">
            <Button variant="outline" className="w-full">
              View Your Schedule
            </Button>
          </Link>
          <Link href="/billing" className="w-full">
            <Button variant="ghost" className="w-full">
              View Billing Details
            </Button>
          </Link>
        </motion.div>

        {/* Help Text */}
        <p className="text-neutral-500 text-sm text-center mt-6">
          Questions? Contact Coach Chuck at{' '}
          <a href="mailto:chuck@m3noover.com" className="text-accent-500 hover:text-accent-400">
            chuck@m3noover.com
          </a>
        </p>
      </motion.div>
    </div>
  );
}
