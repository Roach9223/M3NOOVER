'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@m3noover/ui';
import { ScheduleCalendar } from '@/components/scheduling';
import { format, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import type { Booking, CalendarEvent } from '@/types/scheduling';

export default function AdminSchedulePage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const fetchBookings = useCallback(async () => {
    const start = format(startOfWeek(currentDate), 'yyyy-MM-dd');
    const end = format(endOfWeek(addWeeks(currentDate, 1)), 'yyyy-MM-dd');

    try {
      const res = await fetch(`/api/scheduling/bookings?start=${start}&end=${end}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleMarkComplete = async (bookingId: string, status: 'completed' | 'no_show') => {
    try {
      const res = await fetch(`/api/scheduling/bookings/${bookingId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
        );
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error('Failed to update booking:', error);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this session?')) return;

    try {
      const res = await fetch(`/api/scheduling/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' as const } : b))
        );
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    }
  };

  // Convert bookings to calendar events
  const events: CalendarEvent[] = bookings
    .filter((b) => b.status !== 'cancelled')
    .map((b) => ({
      id: b.id,
      title: `${b.parent?.full_name || 'Client'} - ${b.session_type?.name || 'Session'}`,
      start: new Date(b.start_time),
      end: new Date(b.end_time),
      resource: b,
      type: 'booking' as const,
    }));

  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.resource) {
      setSelectedBooking(event.resource);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Schedule</h1>
          <p className="text-neutral-400 mt-1">View and manage all booked sessions</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/schedule/quick-book">
            <Button variant="primary">Quick Book</Button>
          </Link>
          <Link href="/admin/schedule/availability">
            <Button variant="outline">Manage Availability</Button>
          </Link>
          <Link href="/admin/schedule/session-types">
            <Button variant="outline">Session Types</Button>
          </Link>
        </div>
      </div>

      {/* Calendar */}
      <ScheduleCalendar
        events={events}
        onSelectEvent={handleSelectEvent}
        defaultView="week"
      />

      {/* Selected Booking Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Session Details</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-neutral-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <p className="text-sm text-neutral-500">Client</p>
                <p className="text-white">{selectedBooking.parent?.full_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Session Type</p>
                <p className="text-white">{selectedBooking.session_type?.name || 'Training'}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Date & Time</p>
                <p className="text-white">
                  {format(new Date(selectedBooking.start_time), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-white">
                  {format(new Date(selectedBooking.start_time), 'h:mm a')} -{' '}
                  {format(new Date(selectedBooking.end_time), 'h:mm a')}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Status</p>
                <p className="text-white capitalize">{selectedBooking.status}</p>
              </div>
              {selectedBooking.notes && (
                <div>
                  <p className="text-sm text-neutral-500">Notes</p>
                  <p className="text-white">{selectedBooking.notes}</p>
                </div>
              )}
            </div>

            {selectedBooking.status === 'confirmed' && (
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleMarkComplete(selectedBooking.id, 'completed')}
                  className="flex-1"
                >
                  Mark Complete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkComplete(selectedBooking.id, 'no_show')}
                  className="flex-1"
                >
                  No Show
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancel(selectedBooking.id)}
                  className="text-red-400 hover:bg-red-500/10"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
