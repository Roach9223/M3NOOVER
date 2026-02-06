// Re-export server utilities (for API routes)
export {
  stripe,
  getOrCreateStripeCustomer,
  getStripeCustomer,
  isStripeConfigured,
  formatAmountForDisplay,
  formatAmountForStripe,
} from './server';

// Re-export products config
export {
  STRIPE_PRODUCTS,
  SUBSCRIPTION_TIERS,
  ONE_TIME_PURCHASES,
  getSubscriptionPrice,
  getOneTimePrice,
  getPriceId,
  type SubscriptionTier,
  type OneTimePurchase,
} from './products';

// Note: Client utilities (getStripe, redirectToCheckout) should be imported
// directly from '@/lib/stripe/client' in client components to avoid
// bundling server code in the client bundle.
