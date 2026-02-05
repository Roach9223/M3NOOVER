'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@m3noover/ui';
import { format } from 'date-fns';
import { formatAmountForDisplay } from '@/lib/format';
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
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/scheduling/bookings/${id}`);
        if (res.ok) {
          const data = await res.json();
          setBooking(data);
        }
      } catch (error) {
        console.error('Failed to fetch booking:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBooking();
  }, [id]);

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

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-400">Booking not found.</p>
        <Link href="/schedule">
          <Button variant="secondary" className="mt-4">
            Back to Schedule
          </Button>
        </Link>
      </div>
    );
  }

  const canCancel = booking.status === 'confirmed' || booking.status === 'pending';
  const startDate = new Date(booking.start_time);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
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
          <h1 className="text-2xl font-bold text-white">Session Details</h1>
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
              {format(startDate, 'h:mm a')} - {format(new Date(booking.end_time), 'h:mm a')}
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
      {canCancel && (
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isCancelling}
            className="flex-1 text-red-400 border-red-400/50 hover:bg-red-500/10"
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Session'}
          </Button>
        </div>
      )}
    </div>
  );
}
