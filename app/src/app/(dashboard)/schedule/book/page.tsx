'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@m3noover/ui';
import { SessionTypeSelector, TimeSlotPicker } from '@/components/scheduling';
import { formatAmountForDisplay } from '@/lib/format';
import { format } from 'date-fns';
import type { SessionType, TimeSlot } from '@/types/scheduling';
import type { BookingEligibility } from '@/app/api/booking-eligibility/route';
import { STRIPE_PRODUCTS } from '@/lib/stripe/products';

type UserType = 'subscriber' | 'credits' | 'none';
type SubscriberStep = 'time' | 'confirm';
type CreditsStep = 'type' | 'time' | 'confirm';

export default function BookSessionPage() {
  const router = useRouter();
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [selectedType, setSelectedType] = useState<SessionType | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<BookingEligibility | null>(null);

  // Determine user type from eligibility
  const userType: UserType = useMemo(() => {
    if (!eligibility) return 'none';

    // Has active subscription with remaining sessions (or unlimited)
    if (eligibility.subscription) {
      const { sessionsRemaining } = eligibility.subscription;
      if (sessionsRemaining === null || sessionsRemaining > 0) {
        return 'subscriber';
      }
    }

    // Has credits (either as backup for subscription or standalone)
    if (eligibility.sessionCredits && eligibility.sessionCredits.available > 0) {
      return 'credits';
    }

    return 'none';
  }, [eligibility]);

  // Step management - subscribers start at 'time', credits start at 'type'
  const [subscriberStep, setSubscriberStep] = useState<SubscriberStep>('time');
  const [creditsStep, setCreditsStep] = useState<CreditsStep>('type');

  // Find default session type for subscribers (individual 60-min session)
  const defaultSessionType = useMemo(() => {
    return sessionTypes.find(
      (type) => type.max_athletes === 1 && type.duration_minutes === 60
    ) || sessionTypes[0] || null;
  }, [sessionTypes]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [eligibilityRes, typesRes] = await Promise.all([
          fetch('/api/booking-eligibility'),
          fetch('/api/scheduling/session-types'),
        ]);

        if (eligibilityRes.ok) {
          const data = await eligibilityRes.json();
          setEligibility(data);
        }

        if (typesRes.ok) {
          const data = await typesRes.json();
          setSessionTypes(data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Auto-select default session type for subscribers
  useEffect(() => {
    if (userType === 'subscriber' && defaultSessionType && !selectedType) {
      setSelectedType(defaultSessionType);
    }
  }, [userType, defaultSessionType, selectedType]);

  const handleTypeSelect = (type: SessionType) => {
    setSelectedType(type);
    setCreditsStep('time');
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    if (userType === 'subscriber') {
      setSubscriberStep('confirm');
    } else {
      setCreditsStep('confirm');
    }
  };

  const handleSubmit = async () => {
    if (!selectedType || !selectedSlot) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/scheduling/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_type_id: selectedType.id,
          start_time: selectedSlot.start.toISOString(),
          notes: notes || undefined,
        }),
      });

      if (res.ok) {
        const booking = await res.json();
        router.push(`/schedule/${booking.id}?booked=true`);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to book session');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to book session');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get plan display info for subscribers
  const getPlanInfo = () => {
    if (!eligibility?.subscription) return null;
    const { tier, sessionsPerWeek, sessionsUsedThisWeek, sessionsRemaining } = eligibility.subscription;
    const planName = STRIPE_PRODUCTS.subscriptions[tier]?.name || tier;

    if (sessionsPerWeek === null || sessionsRemaining === null) {
      return { name: planName, status: 'Unlimited Sessions' };
    }

    return {
      name: planName,
      status: `${sessionsUsedThisWeek} of ${sessionsPerWeek} sessions used this week`,
    };
  };

  // Get payment display for confirmation step
  const getPaymentDisplay = () => {
    if (userType === 'subscriber' && eligibility?.subscription) {
      const planName = STRIPE_PRODUCTS.subscriptions[eligibility.subscription.tier]?.name || eligibility.subscription.tier;
      return (
        <div className="text-right">
          <div className="flex items-center gap-2 text-green-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg font-bold">Included</span>
          </div>
          <p className="text-sm text-neutral-400 mt-1">with {planName}</p>
        </div>
      );
    }

    if (eligibility?.sessionCredits && eligibility.sessionCredits.available > 0) {
      return (
        <div className="text-right">
          <span className="text-lg font-bold text-accent-500">1 credit used</span>
          <p className="text-sm text-neutral-400 mt-1">
            {eligibility.sessionCredits.available - 1} credits remaining after
          </p>
        </div>
      );
    }

    return (
      <span className="text-2xl font-bold text-accent-500">
        {selectedType ? formatAmountForDisplay(selectedType.price_cents) : '--'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  // No eligibility - show message and redirect option
  if (!eligibility?.canBook || userType === 'none') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-16 h-16 mx-auto mb-6 bg-amber-500/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Unable to Book</h2>
        <p className="text-neutral-400 mb-8 max-w-md mx-auto">
          {eligibility?.reason || 'You need an active subscription or session credits to book.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/packages">
            <Button variant="primary">View Training Plans</Button>
          </Link>
          <Link href="/schedule">
            <Button variant="outline">Back to Schedule</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================================
  // SUBSCRIBER FLOW (2 steps: Time → Confirm)
  // ============================================================================
  if (userType === 'subscriber') {
    const planInfo = getPlanInfo();
    const currentStep = subscriberStep;
    const steps = ['time', 'confirm'] as const;

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with Plan Badge */}
        <div className="flex items-center gap-4">
          <Link href="/schedule">
            <Button variant="ghost" size="sm">
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">Book Your Next Session</h1>
              {planInfo && (
                <span className="px-3 py-1 bg-accent-500/20 text-accent-400 text-sm font-medium rounded-full">
                  {planInfo.name}
                </span>
              )}
            </div>
            <p className="text-neutral-400 mt-1">
              {currentStep === 'time' && 'Choose your preferred date and time'}
              {currentStep === 'confirm' && 'Confirm your booking'}
            </p>
          </div>
        </div>

        {/* Plan Status Banner */}
        {planInfo && (
          <div className="p-4 bg-accent-500/10 border border-accent-500/30 rounded-xl">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-accent-400 font-medium">{planInfo.status}</p>
            </div>
          </div>
        )}

        {/* Progress (2 steps) */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full ${
                steps.indexOf(currentStep) >= i ? 'bg-accent-500' : 'bg-charcoal-800'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Select Time */}
        {currentStep === 'time' && selectedType && (
          <div>
            <div className="mb-6 p-4 bg-charcoal-900 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-500/10 rounded-lg">
                  <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">{selectedType.name}</p>
                  <p className="text-sm text-neutral-400">{selectedType.duration_minutes} minutes</p>
                </div>
              </div>
            </div>

            <TimeSlotPicker
              sessionTypeId={selectedType.id}
              selectedSlot={selectedSlot || undefined}
              onSelect={handleSlotSelect}
            />
          </div>
        )}

        {/* Step 2: Confirm */}
        {currentStep === 'confirm' && selectedType && selectedSlot && (
          <div className="space-y-6">
            <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Booking Summary</h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-charcoal-800">
                  <span className="text-neutral-400">Session Type</span>
                  <span className="text-white font-medium">{selectedType.name}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-charcoal-800">
                  <span className="text-neutral-400">Date</span>
                  <span className="text-white font-medium">
                    {format(selectedSlot.start, 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-charcoal-800">
                  <span className="text-neutral-400">Time</span>
                  <span className="text-white font-medium">
                    {format(selectedSlot.start, 'h:mm a')} - {format(selectedSlot.end, 'h:mm a')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-charcoal-800">
                  <span className="text-neutral-400">Duration</span>
                  <span className="text-white font-medium">{selectedType.duration_minutes} minutes</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-neutral-400">Payment</span>
                  {getPaymentDisplay()}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or things Coach Chuck should know?"
                className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedSlot(null);
                  setSubscriberStep('time');
                }}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // CREDITS FLOW (3 steps: Type → Time → Confirm)
  // ============================================================================
  const currentStep = creditsStep;
  const steps = ['type', 'time', 'confirm'] as const;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/schedule">
          <Button variant="ghost" size="sm">
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Book a Session</h1>
          <p className="text-neutral-400 mt-1">
            {currentStep === 'type' && 'Select a session type'}
            {currentStep === 'time' && 'Choose your preferred time'}
            {currentStep === 'confirm' && 'Confirm your booking'}
          </p>
        </div>
      </div>

      {/* Credits Banner */}
      {eligibility?.sessionCredits && (
        <div className="p-4 bg-accent-500/10 border border-accent-500/30 rounded-xl">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <p className="text-accent-400 font-medium">
              You have {eligibility.sessionCredits.available} session credit{eligibility.sessionCredits.available !== 1 ? 's' : ''} remaining
            </p>
          </div>
        </div>
      )}

      {/* Progress (3 steps) */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full ${
              steps.indexOf(currentStep) >= i ? 'bg-accent-500' : 'bg-charcoal-800'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Select Type */}
      {currentStep === 'type' && (
        <SessionTypeSelector
          sessionTypes={sessionTypes}
          selectedId={selectedType?.id}
          onSelect={handleTypeSelect}
          eligibility={eligibility}
        />
      )}

      {/* Step 2: Select Time */}
      {currentStep === 'time' && selectedType && (
        <div>
          <div className="mb-6 p-4 bg-charcoal-900 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{selectedType.name}</p>
              <p className="text-sm text-neutral-400">{selectedType.duration_minutes} minutes • 1 credit</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setCreditsStep('type')}>
              Change
            </Button>
          </div>

          <TimeSlotPicker
            sessionTypeId={selectedType.id}
            selectedSlot={selectedSlot || undefined}
            onSelect={handleSlotSelect}
          />
        </div>
      )}

      {/* Step 3: Confirm */}
      {currentStep === 'confirm' && selectedType && selectedSlot && (
        <div className="space-y-6">
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Booking Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-charcoal-800">
                <span className="text-neutral-400">Session Type</span>
                <span className="text-white font-medium">{selectedType.name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-charcoal-800">
                <span className="text-neutral-400">Date</span>
                <span className="text-white font-medium">
                  {format(selectedSlot.start, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-charcoal-800">
                <span className="text-neutral-400">Time</span>
                <span className="text-white font-medium">
                  {format(selectedSlot.start, 'h:mm a')} - {format(selectedSlot.end, 'h:mm a')}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-charcoal-800">
                <span className="text-neutral-400">Duration</span>
                <span className="text-white font-medium">{selectedType.duration_minutes} minutes</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-neutral-400">Payment</span>
                {getPaymentDisplay()}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or things Coach Chuck should know?"
              className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedSlot(null);
                setCreditsStep('time');
              }}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
