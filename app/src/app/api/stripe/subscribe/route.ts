import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { package_id } = await request.json();

    if (!package_id) {
      return NextResponse.json({ error: 'Package ID required' }, { status: 400 });
    }

    // Get package
    const { data: pkg, error: pkgError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', package_id)
      .eq('is_active', true)
      .single();

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Check if user already has active subscription
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('parent_id', user.id)
      .eq('status', 'active')
      .single();

    if (existingSub) {
      return NextResponse.json({ error: 'You already have an active subscription' }, { status: 400 });
    }

    // For recurring packages, create subscription checkout
    if (pkg.is_recurring) {
      // Create or get Stripe Price
      let priceId = pkg.stripe_price_id;

      if (!priceId) {
        // Create a price in Stripe
        const price = await stripe.prices.create({
          currency: 'usd',
          unit_amount: pkg.price_cents,
          recurring: { interval: 'month' },
          product_data: {
            name: pkg.name,
            metadata: { package_id: pkg.id },
          },
        });
        priceId = price.id;

        // Save price ID back to database
        await supabase
          .from('packages')
          .update({ stripe_price_id: priceId })
          .eq('id', pkg.id);
      }

      // Create subscription checkout session
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/packages?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/packages?cancelled=true`,
        metadata: {
          package_id: pkg.id,
          user_id: user.id,
          type: 'subscription',
        },
        customer_email: user.email,
      });

      return NextResponse.json({ url: session.url });
    } else {
      // For one-time packages (drop-in), create payment checkout
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: pkg.name,
              description: pkg.description || undefined,
            },
            unit_amount: pkg.price_cents,
          },
          quantity: 1,
        }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/packages?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/packages?cancelled=true`,
        metadata: {
          package_id: pkg.id,
          user_id: user.id,
          type: 'one_time_package',
        },
        customer_email: user.email,
      });

      return NextResponse.json({ url: session.url });
    }
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
