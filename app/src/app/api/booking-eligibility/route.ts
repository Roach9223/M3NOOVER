import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { STRIPE_PRODUCTS, type SubscriptionTier } from '@/lib/stripe/products';

export interface BookingEligibility {
  canBook: boolean;
  reason?: string;
  subscription?: {
    tier: SubscriptionTier;
    sessionsPerWeek: number | null; // null = unlimited
    sessionsUsedThisWeek: number;
    sessionsRemaining: number | null; // null = unlimited
  };
  sessionCredits?: {
    available: number;
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (admins can always book)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'admin') {
      return NextResponse.json({
        canBook: true,
        reason: 'Admin bypass',
      } as BookingEligibility);
    }

    // Get active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, sessions_per_week, status')
      .eq('parent_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get session credits
    const { data: credits } = await supabase
      .from('session_credits')
      .select('total_sessions, used_sessions')
      .eq('profile_id', user.id)
      .or('expires_at.is.null,expires_at.gt.now()');

    const availableCredits = credits?.reduce(
      (sum, c) => sum + Math.max(0, c.total_sessions - c.used_sessions),
      0
    ) || 0;

    // If user has an active subscription, check weekly limit
    if (subscription) {
      const tier = subscription.tier as SubscriptionTier;
      const sessionsPerWeek = subscription.sessions_per_week;

      // Get sessions booked this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const { data: weeklyBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('parent_id', user.id)
        .gte('start_time', startOfWeek.toISOString())
        .in('status', ['confirmed', 'pending', 'completed']);

      const sessionsUsedThisWeek = weeklyBookings?.length || 0;

      // Unlimited sessions (elite tier or null sessions_per_week)
      if (sessionsPerWeek === null || sessionsPerWeek === -1) {
        return NextResponse.json({
          canBook: true,
          subscription: {
            tier,
            sessionsPerWeek: null,
            sessionsUsedThisWeek,
            sessionsRemaining: null,
          },
          sessionCredits: availableCredits > 0 ? { available: availableCredits } : undefined,
        } as BookingEligibility);
      }

      // Check if under weekly limit
      const sessionsRemaining = sessionsPerWeek - sessionsUsedThisWeek;

      if (sessionsRemaining > 0) {
        return NextResponse.json({
          canBook: true,
          subscription: {
            tier,
            sessionsPerWeek,
            sessionsUsedThisWeek,
            sessionsRemaining,
          },
          sessionCredits: availableCredits > 0 ? { available: availableCredits } : undefined,
        } as BookingEligibility);
      }

      // Subscription limit reached, check if they have credits
      if (availableCredits > 0) {
        return NextResponse.json({
          canBook: true,
          reason: 'Weekly subscription limit reached, will use session credits',
          subscription: {
            tier,
            sessionsPerWeek,
            sessionsUsedThisWeek,
            sessionsRemaining: 0,
          },
          sessionCredits: { available: availableCredits },
        } as BookingEligibility);
      }

      // No remaining sessions and no credits
      return NextResponse.json({
        canBook: false,
        reason: `You've used all ${sessionsPerWeek} sessions this week. Purchase additional credits or wait until next week.`,
        subscription: {
          tier,
          sessionsPerWeek,
          sessionsUsedThisWeek,
          sessionsRemaining: 0,
        },
      } as BookingEligibility);
    }

    // No subscription - check credits
    if (availableCredits > 0) {
      return NextResponse.json({
        canBook: true,
        sessionCredits: { available: availableCredits },
      } as BookingEligibility);
    }

    // No subscription and no credits
    return NextResponse.json({
      canBook: false,
      reason: 'You need an active subscription or session credits to book.',
    } as BookingEligibility);
  } catch (error) {
    console.error('Error checking booking eligibility:', error);
    return NextResponse.json(
      { error: 'Failed to check booking eligibility' },
      { status: 500 }
    );
  }
}
