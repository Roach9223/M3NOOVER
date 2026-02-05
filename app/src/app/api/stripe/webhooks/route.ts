import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Use service role for webhook operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;

  if (metadata?.type === 'invoice_payment' && metadata.invoice_id) {
    // Mark invoice as paid
    await supabaseAdmin
      .from('invoices')
      .update({
        status: 'paid',
        stripe_payment_intent_id: session.payment_intent as string,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', metadata.invoice_id);

    console.log(`Invoice ${metadata.invoice_id} marked as paid`);
  }

  if (metadata?.type === 'subscription' && metadata.package_id && metadata.user_id) {
    // Subscription will be handled by subscription.created event
    console.log(`Subscription checkout completed for package ${metadata.package_id}`);
  }

  if (metadata?.type === 'one_time_package' && metadata.package_id && metadata.user_id) {
    // Log one-time package purchase (could create a sessions credit record)
    console.log(`One-time package ${metadata.package_id} purchased by user ${metadata.user_id}`);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const packageId = subscription.metadata?.package_id;
  const customerId = subscription.customer as string;

  // Get user email from customer
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return;

  const email = customer.email;
  if (!email) return;

  // Find user by email
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', (await supabaseAdmin.auth.admin.listUsers()).data.users.find(u => u.email === email)?.id || '')
    .single();

  if (!profile) {
    console.error('Could not find profile for customer:', email);
    return;
  }

  // Check if subscription record exists
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  // Get period dates from subscription items or subscription itself
  const subAny = subscription as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };

  const subData = {
    parent_id: profile.id,
    package_id: packageId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    status: mapStripeStatus(subscription.status),
    current_period_start: subAny.current_period_start
      ? new Date(subAny.current_period_start * 1000).toISOString()
      : null,
    current_period_end: subAny.current_period_end
      ? new Date(subAny.current_period_end * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };

  if (existingSub) {
    await supabaseAdmin
      .from('subscriptions')
      .update(subData)
      .eq('id', existingSub.id);
  } else {
    await supabaseAdmin
      .from('subscriptions')
      .insert(subData);
  }

  console.log(`Subscription ${subscription.id} updated`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  console.log(`Subscription ${subscription.id} cancelled`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // This handles Stripe's own invoices for subscriptions
  // Cast to access subscription property which may exist on invoice
  const invoiceAny = invoice as unknown as { subscription?: string | null };
  if (invoiceAny.subscription) {
    console.log(`Subscription invoice paid: ${invoice.id}`);
  }
}

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
