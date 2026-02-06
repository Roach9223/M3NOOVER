import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, getOrCreateStripeCustomer, STRIPE_PRODUCTS, type SubscriptionTier } from '@/lib/stripe';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

interface SubscribeRequest {
  priceId: string;
  tier: SubscriptionTier;
}

export async function POST(request: Request) {
  // Debug: Log environment configuration at start
  console.log('[Subscribe] Environment check:', {
    STRIPE_SECRET_KEY_SET: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_SECRET_KEY_PREFIX: process.env.STRIPE_SECRET_KEY?.substring(0, 7) || 'NOT_SET',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET',
    stripeInitialized: !!stripe,
  });

  try {
    if (!stripe) {
      console.error('[Subscribe] Stripe not initialized - STRIPE_SECRET_KEY may be missing or invalid');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      console.log('[Subscribe] No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and log request body
    let body: SubscribeRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[Subscribe] Failed to parse request body:', parseError);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { priceId, tier } = body;
    console.log('[Subscribe] Request received:', {
      userId: user.id,
      email: user.email,
      priceId,
      tier,
      expectedPriceId: tier ? STRIPE_PRODUCTS.subscriptions[tier as SubscriptionTier]?.priceId : 'UNKNOWN_TIER',
    });

    // Validate the tier exists
    if (!tier || !(tier in STRIPE_PRODUCTS.subscriptions)) {
      console.error('[Subscribe] Invalid tier:', { tier, validTiers: Object.keys(STRIPE_PRODUCTS.subscriptions) });
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
    }

    // Validate the priceId matches the tier
    const expectedProduct = STRIPE_PRODUCTS.subscriptions[tier];
    if (priceId !== expectedProduct.priceId) {
      console.error('[Subscribe] Price ID mismatch:', {
        receivedPriceId: priceId,
        expectedPriceId: expectedProduct.priceId,
        tier,
      });
      return NextResponse.json({ error: 'Price ID does not match tier' }, { status: 400 });
    }

    // Check if user already has an active subscription
    const { data: existingSub, error: subError } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('parent_id', user.id)
      .in('status', ['active', 'past_due'])
      .single();

    if (subError && subError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('[Subscribe] Error checking existing subscription:', subError);
    }

    if (existingSub) {
      console.log('[Subscribe] User already has active subscription:', existingSub);
      return NextResponse.json(
        { error: 'You already have an active subscription. Manage it from the billing portal.' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let customerId: string;
    try {
      console.log('[Subscribe] Getting or creating Stripe customer for:', { userId: user.id, email: user.email });
      customerId = await getOrCreateStripeCustomer(user.id, user.email);
      console.log('[Subscribe] Stripe customer ID:', customerId);
    } catch (customerError) {
      console.error('[Subscribe] Failed to get/create Stripe customer:', {
        error: customerError,
        message: customerError instanceof Error ? customerError.message : 'Unknown error',
      });
      return NextResponse.json(
        { error: 'Failed to create customer record' },
        { status: 500 }
      );
    }

    // Create Stripe Checkout Session for subscription
    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/packages`,
      metadata: {
        type: 'subscription',
        tier,
        userId: user.id,
        sessionsPerWeek: String(expectedProduct.sessionsPerWeek),
      },
      subscription_data: {
        metadata: {
          tier,
          userId: user.id,
          sessionsPerWeek: String(expectedProduct.sessionsPerWeek),
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    };

    console.log('[Subscribe] Creating checkout session with params:', {
      mode: checkoutParams.mode,
      customer: checkoutParams.customer,
      priceId: checkoutParams.line_items?.[0]?.price,
      success_url: checkoutParams.success_url,
      cancel_url: checkoutParams.cancel_url,
      metadata: checkoutParams.metadata,
    });

    try {
      const session = await stripe.checkout.sessions.create(checkoutParams);

      console.log('[Subscribe] Checkout session created successfully:', {
        sessionId: session.id,
        url: session.url,
      });

      logger.info('Subscription checkout session created', {
        userId: user.id,
        tier,
        sessionId: session.id,
      });

      return NextResponse.json({ url: session.url });
    } catch (stripeError) {
      // Detailed Stripe error logging
      if (stripeError instanceof Stripe.errors.StripeError) {
        console.error('[Subscribe] Stripe API Error:', {
          type: stripeError.type,
          code: stripeError.code,
          message: stripeError.message,
          param: stripeError.param,
          statusCode: stripeError.statusCode,
          requestId: stripeError.requestId,
          raw: stripeError.raw,
        });

        // Return more specific error message based on Stripe error type
        if (stripeError.code === 'resource_missing') {
          return NextResponse.json(
            { error: `Invalid price ID: ${priceId}. This price may not exist in Stripe.` },
            { status: 400 }
          );
        }
      } else {
        console.error('[Subscribe] Unknown Stripe error:', stripeError);
      }

      throw stripeError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    // Final catch-all error handler
    console.error('[Subscribe] Unhandled error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    logger.error('Subscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
