import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { stripe, STRIPE_PRODUCTS, type SubscriptionTier } from '@/lib/stripe';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Use service role for webhook operations (bypasses RLS)
const supabaseAdmin =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

export async function POST(request: Request) {
  if (!stripe || !supabaseAdmin) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Webhook signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        logger.debug('Unhandled Stripe event', { eventType: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // Log the error but return 200 to prevent Stripe from retrying
    // Stripe retries on non-2xx responses, which can cause duplicates
    logger.error('Webhook handler failed', error);
    return NextResponse.json({ received: true, error: 'Handler failed but acknowledged' });
  }
}

/**
 * Handle checkout.session.completed
 * Creates subscription or session_credits record
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!supabaseAdmin || !stripe) return;

  const metadata = session.metadata;
  const userId = metadata?.userId;

  if (!userId) {
    logger.warn('Checkout completed without userId in metadata', { sessionId: session.id });
    return;
  }

  // Handle subscription checkout
  if (session.mode === 'subscription' && metadata?.type === 'subscription') {
    const tier = metadata.tier as SubscriptionTier;
    const subscriptionId = session.subscription as string;

    if (!subscriptionId) {
      logger.warn('No subscription ID in checkout session');
      return;
    }

    // Fetch full subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = stripeSubscription.items.data[0]?.price.id;

    // Get sessions per week from the product config
    const productConfig = tier ? STRIPE_PRODUCTS.subscriptions[tier] : null;
    const sessionsPerWeek = productConfig?.sessionsPerWeek ?? null;

    // Check if record exists
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    // Type assertion for subscription period dates
    const subWithPeriod = stripeSubscription as unknown as {
      current_period_start: number;
      current_period_end: number;
      cancel_at_period_end: boolean;
      status: Stripe.Subscription.Status;
    };

    const subData = {
      parent_id: userId,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: session.customer as string,
      stripe_price_id: priceId,
      tier,
      status: mapStripeStatus(subWithPeriod.status),
      sessions_per_week: sessionsPerWeek === -1 ? null : sessionsPerWeek,
      current_period_start: new Date(subWithPeriod.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subWithPeriod.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subWithPeriod.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    };

    if (existingSub) {
      await supabaseAdmin
        .from('subscriptions')
        .update(subData)
        .eq('id', existingSub.id);
    } else {
      await supabaseAdmin.from('subscriptions').insert({
        ...subData,
        created_at: new Date().toISOString(),
      });
    }

    logger.info('Subscription created from checkout', { subscriptionId, tier, userId });
  }

  // Handle session pack (one-time payment) checkout
  if (session.mode === 'payment' && metadata?.type === 'session_pack') {
    const productType = metadata.productType;
    const sessions = parseInt(metadata.sessions || '0', 10);
    const priceCents = parseInt(metadata.priceCents || '0', 10);
    const paymentIntentId = session.payment_intent as string;

    if (sessions <= 0) {
      logger.warn('Invalid session count in checkout metadata');
      return;
    }

    // Idempotency check: skip if this checkout session was already processed
    const { data: existingCredit } = await supabaseAdmin
      .from('session_credits')
      .select('id')
      .eq('stripe_checkout_session_id', session.id)
      .single();

    if (existingCredit) {
      logger.info('Session credits already exist for checkout session (idempotent)', { sessionId: session.id });
      return;
    }

    // Create session_credits record
    await supabaseAdmin.from('session_credits').insert({
      profile_id: userId,
      total_sessions: sessions,
      used_sessions: 0,
      stripe_payment_intent_id: paymentIntentId,
      stripe_checkout_session_id: session.id,
      product_type: productType,
      price_cents: priceCents,
      purchased_at: new Date().toISOString(),
      expires_at: null, // No expiry for now
    });

    logger.info('Session credits created', { userId, sessions, productType });
  }

  // Handle invoice payment (legacy support)
  if (session.mode === 'payment' && metadata?.type === 'invoice_payment' && metadata.invoice_id) {
    await supabaseAdmin
      .from('invoices')
      .update({
        status: 'paid',
        stripe_payment_intent_id: session.payment_intent as string,
        stripe_checkout_session_id: session.id,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', metadata.invoice_id);

    logger.info('Invoice marked as paid', { invoiceId: metadata.invoice_id });
  }
}

/**
 * Handle invoice.paid
 * Updates subscription period dates
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!supabaseAdmin) return;

  // Type assertion for invoice with subscription
  const invoiceWithSub = invoice as unknown as { subscription?: string | null };
  const subscriptionId = invoiceWithSub.subscription;

  if (!subscriptionId) {
    return; // Not a subscription invoice
  }

  // Get the subscription lines to extract period info
  const lineItem = invoice.lines.data.find((line) => {
    const lineWithType = line as unknown as { type?: string };
    return lineWithType.type === 'subscription';
  });

  if (lineItem?.period) {
    await supabaseAdmin
      .from('subscriptions')
      .update({
        current_period_start: new Date(lineItem.period.start * 1000).toISOString(),
        current_period_end: new Date(lineItem.period.end * 1000).toISOString(),
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);

    logger.info('Subscription period updated from invoice', { subscriptionId });
  }
}

/**
 * Handle invoice.payment_failed
 * Updates subscription status to past_due
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!supabaseAdmin) return;

  // Type assertion for invoice with subscription
  const invoiceWithSub = invoice as unknown as { subscription?: string | null };
  const subscriptionId = invoiceWithSub.subscription;

  if (!subscriptionId) {
    return;
  }

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  logger.info('Subscription marked as past_due', { subscriptionId });

  // TODO: Send notification email via Resend
  // const { data: sub } = await supabaseAdmin
  //   .from('subscriptions')
  //   .select('parent_id, profiles(email, full_name)')
  //   .eq('stripe_subscription_id', subscriptionId)
  //   .single();
  // if (sub?.profiles?.email) {
  //   await sendPaymentFailedEmail(sub.profiles.email, sub.profiles.full_name);
  // }
}

/**
 * Handle customer.subscription.updated
 * Syncs subscription status, period, and cancel_at_period_end
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  if (!supabaseAdmin) return;

  const tier = subscription.metadata?.tier as SubscriptionTier | undefined;
  const priceId = subscription.items.data[0]?.price.id;

  const productConfig = tier ? STRIPE_PRODUCTS.subscriptions[tier] : null;
  const sessionsPerWeek = productConfig?.sessionsPerWeek ?? null;

  // Type assertion for subscription period dates
  const subWithPeriod = subscription as unknown as {
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    status: Stripe.Subscription.Status;
  };

  await supabaseAdmin
    .from('subscriptions')
    .update({
      stripe_price_id: priceId,
      tier: tier || null,
      status: mapStripeStatus(subWithPeriod.status),
      sessions_per_week: sessionsPerWeek === -1 ? null : sessionsPerWeek,
      current_period_start: new Date(subWithPeriod.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subWithPeriod.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subWithPeriod.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  logger.info('Subscription updated', {
    subscriptionId: subscription.id,
    status: subWithPeriod.status,
    cancelAtPeriodEnd: subWithPeriod.cancel_at_period_end,
  });
}

/**
 * Handle customer.subscription.deleted
 * Sets subscription status to canceled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  if (!supabaseAdmin) return;

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  logger.info('Subscription cancelled', { subscriptionId: subscription.id });
}

/**
 * Map Stripe subscription status to our status enum
 */
function mapStripeStatus(status: Stripe.Subscription.Status): string {
  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'cancelled',
    unpaid: 'past_due',
    paused: 'paused',
    trialing: 'active',
    incomplete: 'active',
    incomplete_expired: 'cancelled',
  };
  return statusMap[status] || 'active';
}
