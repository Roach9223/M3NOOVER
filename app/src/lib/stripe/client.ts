import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get the Stripe.js instance (client-side only)
 *
 * This is a singleton that loads Stripe.js once and reuses the instance.
 * Safe to call multiple times - will return the same promise.
 *
 * Usage:
 * ```tsx
 * const stripe = await getStripe();
 * if (stripe) {
 *   await stripe.redirectToCheckout({ sessionId });
 * }
 * ```
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not configured');
      stripePromise = Promise.resolve(null);
    } else {
      stripePromise = loadStripe(publishableKey);
    }
  }

  return stripePromise;
}

/**
 * Redirect to Stripe Checkout
 *
 * Convenience function to redirect to a checkout session.
 * Uses window.location for the redirect since redirectToCheckout is deprecated.
 *
 * @param url - The Checkout Session URL from the server
 */
export function redirectToCheckout(url: string): void {
  window.location.href = url;
}

/**
 * Check if Stripe is configured on the client
 */
export function isStripeConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}
