import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, getOrCreateStripeCustomer, STRIPE_PRODUCTS, type SubscriptionTier } from '@/lib/stripe';
import { logger } from '@/lib/logger';

interface SubscribeRequest {
  priceId: string;
  tier: SubscriptionTier;
}

export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SubscribeRequest = await request.json();
    const { priceId, tier } = body;

    // Validate the tier exists
    if (!tier || !(tier in STRIPE_PRODUCTS.subscriptions)) {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
    }

    // Validate the priceId matches the tier
    const expectedProduct = STRIPE_PRODUCTS.subscriptions[tier];
    if (priceId !== expectedProduct.priceId) {
      return NextResponse.json({ error: 'Price ID does not match tier' }, { status: 400 });
    }

    // Check if user already has an active subscription
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('parent_id', user.id)
      .in('status', ['active', 'past_due'])
      .single();

    if (existingSub) {
      return NextResponse.json(
        { error: 'You already have an active subscription. Manage it from the billing portal.' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);

    // Create Stripe Checkout Session for subscription
    const session = await stripe.checkout.sessions.create({
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
    });

    logger.info('Subscription checkout session created', {
      userId: user.id,
      tier,
      sessionId: session.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logger.error('Subscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
