'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@m3noover/ui';
import { SessionTypeSelector, TimeSlotPicker } from '@/components/scheduling';
import { formatAmountForDisplay } from '@/lib/format';
import { format } from 'date-fns';
import type { SessionType, TimeSlot } from '@/types/scheduling';

type BookingStep = 'type' | 'time' | 'confirm';

export default function BookSessionPage() {
  const router = useRouter();
  const [step, setStep] = useState<BookingStep>('type');
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [selectedType, setSelectedType] = useState<SessionType | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessionTypes() {
      try {
        const res = await fetch('/api/scheduling/session-types');
        if (res.ok) {
          const data = await res.json();
          setSessionTypes(data);
        }
      } catch (error) {
        console.error('Failed to fetch session types:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSessionTypes();
  }, []);

  const handleTypeSelect = (type: SessionType) => {
    setSelectedType(type);
    setStep('time');
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep('confirm');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
      </div>
    );
  }

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
            {step === 'type' && 'Select a session type'}
            {step === 'time' && 'Choose your preferred time'}
            {step === 'confirm' && 'Confirm your booking'}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {['type', 'time', 'confirm'].map((s, i) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full ${
              ['type', 'time', 'confirm'].indexOf(step) >= i
                ? 'bg-accent-500'
                : 'bg-charcoal-800'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Select Type */}
      {step === 'type' && (
        <SessionTypeSelector
          sessionTypes={sessionTypes}
          selectedId={selectedType?.id}
          onSelect={handleTypeSelect}
        />
      )}

      {/* Step 2: Select Time */}
      {step === 'time' && selectedType && (
        <div>
          <div className="mb-6 p-4 bg-charcoal-900 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{selectedType.name}</p>
              <p className="text-sm text-neutral-400">{selectedType.duration_minutes} minutes</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep('type')}>
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
      {step === 'confirm' && selectedType && selectedSlot && (
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
                <span className="text-neutral-400">Price</span>
                <span className="text-2xl font-bold text-accent-500">
                  {formatAmountForDisplay(selectedType.price_cents)}
                </span>
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
            <Button variant="outline" onClick={() => setStep('time')} className="flex-1">
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
