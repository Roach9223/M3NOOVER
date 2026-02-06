import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, getOrCreateStripeCustomer, STRIPE_PRODUCTS, type OneTimePurchase } from '@/lib/stripe';
import { logger } from '@/lib/logger';

type SessionPackType = 'drop_in' | 'five_pack' | 'ten_pack';

// Map API type to STRIPE_PRODUCTS key
const TYPE_TO_KEY: Record<SessionPackType, OneTimePurchase> = {
  drop_in: 'dropIn',
  five_pack: 'fivePack',
  ten_pack: 'tenPack',
};

// Map to session counts
const TYPE_TO_SESSIONS: Record<SessionPackType, number> = {
  drop_in: 1,
  five_pack: 5,
  ten_pack: 10,
};

interface CheckoutRequest {
  priceId: string;
  type: SessionPackType;
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

    const body: CheckoutRequest = await request.json();
    const { priceId, type } = body;

    // Validate the type
    if (!type || !(type in TYPE_TO_KEY)) {
      return NextResponse.json({ error: 'Invalid purchase type' }, { status: 400 });
    }

    const productKey = TYPE_TO_KEY[type];
    const expectedProduct = STRIPE_PRODUCTS.oneTime[productKey];

    // Validate the priceId matches
    if (priceId !== expectedProduct.priceId) {
      return NextResponse.json({ error: 'Price ID does not match product type' }, { status: 400 });
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);

    const sessions = TYPE_TO_SESSIONS[type];

    // Create Stripe Checkout Session for one-time payment
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
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
        type: 'session_pack',
        productType: type,
        sessions: String(sessions),
        userId: user.id,
        priceCents: String(expectedProduct.price),
      },
      payment_intent_data: {
        metadata: {
          type: 'session_pack',
          productType: type,
          sessions: String(sessions),
          userId: user.id,
        },
      },
      allow_promotion_codes: true,
    });

    logger.info('Session pack checkout created', {
      userId: user.id,
      type,
      sessions,
      sessionId: session.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logger.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
