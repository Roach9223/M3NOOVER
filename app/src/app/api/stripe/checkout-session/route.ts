import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = request.nextUrl.searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product'],
    });

    // Verify this session belongs to the current user by checking customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profile?.stripe_customer_id && session.customer !== profile.stripe_customer_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract relevant info
    const lineItems = session.line_items?.data || [];
    const firstItem = lineItems[0];
    const product = firstItem?.price?.product as { name?: string; description?: string } | undefined;

    return NextResponse.json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      mode: session.mode,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_details?.email,
      product_name: product?.name || firstItem?.description || 'Training Package',
      product_description: product?.description,
      quantity: firstItem?.quantity || 1,
      receipt_url: session.invoice ? null : undefined, // Subscriptions have invoice receipts
      created: session.created,
      metadata: session.metadata,
    });
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve checkout session' },
      { status: 500 }
    );
  }
}
