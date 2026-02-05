'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@m3noover/ui';
import { BookingCard } from '@/components/scheduling';
import type { Booking } from '@/types/scheduling';

export default function SchedulePage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch('/api/scheduling/bookings');
        if (res.ok) {
          const data = await res.json();
          setBookings(data);
        }
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, []);

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
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Cancel error:', error);
    }
  };

  const upcomingBookings = bookings.filter(
    (b) => b.status === 'confirmed' && new Date(b.start_time) > new Date()
  );
  const pastBookings = bookings.filter(
    (b) => b.status === 'completed' || new Date(b.start_time) < new Date()
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Schedule</h1>
          <p className="text-neutral-400 mt-1">View and manage your training sessions</p>
        </div>
        <Link href="/schedule/book">
          <Button variant="primary">Book a Session</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
        </div>
      ) : (
        <>
          {/* Upcoming Sessions */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Upcoming Sessions</h2>
            {upcomingBookings.length === 0 ? (
              <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-8 text-center">
                <p className="text-neutral-400">No upcoming sessions scheduled.</p>
                <Link href="/schedule/book">
                  <Button variant="secondary" className="mt-4">
                    Book Your First Session
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onCancel={() => handleCancel(booking.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Past Sessions */}
          {pastBookings.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Past Sessions</h2>
              <div className="space-y-4">
                {pastBookings.slice(0, 5).map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    showCancelButton={false}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
