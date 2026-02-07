'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@m3noover/ui';
import { format } from 'date-fns';
import { formatAmountForDisplay } from '@/lib/format';
import { AddToCalendar } from '@/components/scheduling';
import type { Booking } from '@/types/scheduling';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400',
  confirmed: 'bg-green-500/10 text-green-400',
  cancelled: 'bg-red-500/10 text-red-400',
  completed: 'bg-blue-500/10 text-blue-400',
  no_show: 'bg-neutral-500/10 text-neutral-400',
};

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const isNewBooking = searchParams.get('booked') === 'true';

  useEffect(() => {
    async function fetchBooking() {
      try {
        setError(null);
        const res = await fetch(`/api/scheduling/bookings/${id}`);

        if (res.ok) {
          const data = await res.json();
          setBooking(data);
        } else {
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));

          // For new bookings, retry a few times as there might be replication lag
          if (isNewBooking && retryCount < 3 && res.status === 404) {
            console.log(`Booking not found yet, retrying (${retryCount + 1}/3)...`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 1000);
            return;
          }

          setError(errorData.error || `Failed to load booking (${res.status})`);
          console.error('API error:', res.status, errorData);
        }
      } catch (err) {
        console.error('Failed to fetch booking:', err);
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    }

    fetchBooking();
  }, [id, isNewBooking, retryCount]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this session?')) return;

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/scheduling/bookings/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/schedule');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Cancel error:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-6">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-lg font-semibold text-white mb-2">
            {error || 'Booking not found'}
          </h2>
          <p className="text-neutral-400 text-sm">
            {isNewBooking
              ? 'Your booking may still be processing. Please wait a moment and try again.'
              : 'The booking you\'re looking for doesn\'t exist or you don\'t have permission to view it.'}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {isNewBooking && (
            <Button
              variant="secondary"
              onClick={() => {
                setLoading(true);
                setRetryCount(prev => prev + 1);
              }}
            >
              Retry
            </Button>
          )}
          <Link href="/schedule">
            <Button variant="ghost" className="w-full">
              Back to Schedule
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const canCancel = booking.status === 'confirmed' || booking.status === 'pending';

  // Parse dates safely
  let startDate: Date;
  let endDate: Date;
  try {
    startDate = new Date(booking.start_time);
    endDate = new Date(booking.end_time);
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date');
    }
  } catch {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <p className="text-red-400">Error displaying booking: invalid date format</p>
        <Link href="/schedule">
          <Button variant="secondary" className="mt-4">Back to Schedule</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Success Banner for new bookings */}
      {isNewBooking && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-green-500/20 rounded-full">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-green-400">Session Booked!</h2>
              <p className="text-green-400/80 mt-1">
                Your training session has been confirmed. Add it to your calendar so you don&apos;t forget!
              </p>
              <div className="mt-4">
                <AddToCalendar booking={booking!} variant="buttons" size="sm" />
              </div>
            </div>
          </div>
        </div>
      )}

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
          <h1 className="text-2xl font-bold text-white">
            {isNewBooking ? 'Booking Confirmed' : 'Session Details'}
          </h1>
        </div>
      </div>

      {/* Booking Card */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {booking.session_type?.name || 'Training Session'}
            </h2>
            <span
              className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium capitalize ${
                statusColors[booking.status]
              }`}
            >
              {booking.status}
            </span>
          </div>
          {booking.session_type?.price_cents && (
            <p className="text-2xl font-bold text-accent-500">
              {formatAmountForDisplay(booking.session_type.price_cents)}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-neutral-300">
            <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{format(startDate, 'EEEE, MMMM d, yyyy')}</span>
          </div>

          <div className="flex items-center gap-3 text-neutral-300">
            <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
            </span>
          </div>

          {booking.session_type?.duration_minutes && (
            <div className="flex items-center gap-3 text-neutral-300">
              <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>{booking.session_type.duration_minutes} minutes</span>
            </div>
          )}

          {booking.notes && (
            <div className="pt-4 border-t border-charcoal-800">
              <p className="text-sm text-neutral-500 mb-1">Notes</p>
              <p className="text-neutral-300">{booking.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        {/* Add to Calendar - show for confirmed/pending bookings */}
        {(booking.status === 'confirmed' || booking.status === 'pending') && !isNewBooking && (
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
            <p className="text-sm text-neutral-400 mb-3">Add this session to your calendar</p>
            <AddToCalendar booking={booking} variant="buttons" />
          </div>
        )}

        {/* Cancel button */}
        {canCancel && (
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isCancelling}
            className="w-full text-red-400 border-red-400/50 hover:bg-red-500/10"
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Session'}
          </Button>
        )}
      </div>
    </div>
  );
}
