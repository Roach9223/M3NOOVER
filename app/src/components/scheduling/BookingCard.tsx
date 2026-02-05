'use client';

import { useState } from 'react';
import { Button } from '@m3noover/ui';
import { format } from 'date-fns';
import { formatAmountForDisplay } from '@/lib/format';
import type { Booking } from '@/types/scheduling';

interface BookingCardProps {
  booking: Booking;
  showCancelButton?: boolean;
  onCancel?: () => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400',
  confirmed: 'bg-green-500/10 text-green-400',
  cancelled: 'bg-red-500/10 text-red-400',
  completed: 'bg-blue-500/10 text-blue-400',
  no_show: 'bg-neutral-500/10 text-neutral-400',
};

export function BookingCard({ booking, showCancelButton = true, onCancel }: BookingCardProps) {
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    if (!onCancel) return;
    setIsCancelling(true);
    try {
      await onCancel();
    } finally {
      setIsCancelling(false);
    }
  };

  const startDate = new Date(booking.start_time);
  const canCancel = booking.status === 'confirmed' || booking.status === 'pending';

  return (
    <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <p className="text-white font-semibold text-lg">
              {booking.session_type?.name || 'Training Session'}
            </p>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                statusColors[booking.status]
              }`}
            >
              {booking.status}
            </span>
          </div>

          <div className="space-y-1 text-sm text-neutral-400">
            <p className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {format(startDate, 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {format(startDate, 'h:mm a')} -{' '}
              {format(new Date(booking.end_time), 'h:mm a')}
            </p>
            {booking.session_type?.duration_minutes && (
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                {booking.session_type.duration_minutes} minutes
              </p>
            )}
          </div>

          {booking.notes && (
            <p className="mt-3 text-sm text-neutral-500 italic">{booking.notes}</p>
          )}
        </div>

        <div className="text-right">
          {booking.session_type?.price_cents && (
            <p className="text-xl font-bold text-white">
              {formatAmountForDisplay(booking.session_type.price_cents)}
            </p>
          )}

          {showCancelButton && canCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isCancelling}
              className="mt-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
