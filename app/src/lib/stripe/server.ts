import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

// Initialize Stripe with the secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY not configured');
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    })
  : null;

/**
 * Get or create a Stripe customer for a user
 *
 * Checks if the user already has a stripe_customer_id in their profile.
 * If not, creates a new Stripe customer and saves the ID back to the profile.
 *
 * @param userId - The Supabase user ID
 * @param email - The user's email address
 * @param name - Optional name for the customer
 * @returns The Stripe customer ID
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const supabaseAdmin = createAdminClient();

  // Check if user already has a Stripe customer ID
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('stripe_customer_id, full_name')
    .eq('id', userId)
    .single();

  if (profileError) {
    throw new Error(`Failed to fetch profile: ${profileError.message}`);
  }

  // Return existing customer ID if present
  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: name || profile?.full_name || undefined,
    metadata: {
      supabase_user_id: userId,
    },
  });

  // Save customer ID to profile
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  if (updateError) {
    // Customer was created but we couldn't save the ID
    // Log the error but return the customer ID anyway
    console.error('Failed to save Stripe customer ID to profile:', updateError);
  }

  return customer.id;
}

/**
 * Get Stripe customer by their customer ID
 */
export async function getStripeCustomer(customerId: string): Promise<Stripe.Customer | null> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      return null;
    }
    return customer as Stripe.Customer;
  } catch {
    return null;
  }
}

/**
 * Helper to check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return stripe !== null;
}

/**
 * Format amount in cents to display string
 */
export function formatAmountForDisplay(amountCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountCents / 100);
}

/**
 * Convert dollars to cents for Stripe
 */
export function formatAmountForStripe(amountDollars: number): number {
  return Math.round(amountDollars * 100);
}
