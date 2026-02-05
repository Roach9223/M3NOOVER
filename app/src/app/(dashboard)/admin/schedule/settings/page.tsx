'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@m3noover/ui';
import type { SchedulingSettings } from '@/types/scheduling';

export default function ScheduleSettingsPage() {
  const [settings, setSettings] = useState<SchedulingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [cancellationNoticeHours, setCancellationNoticeHours] = useState(24);
  const [bookingWindowDays, setBookingWindowDays] = useState(30);
  const [minBookingNoticeHours, setMinBookingNoticeHours] = useState(2);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/scheduling/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
          setCancellationNoticeHours(data.cancellation_notice_hours);
          setBookingWindowDays(data.booking_window_days);
          setMinBookingNoticeHours(data.min_booking_notice_hours);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/scheduling/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancellation_notice_hours: cancellationNoticeHours,
          booking_window_days: bookingWindowDays,
          min_booking_notice_hours: minBookingNoticeHours,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        alert('Settings saved successfully');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
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
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/schedule">
          <Button variant="ghost" size="sm">
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Scheduling Settings</h1>
          <p className="text-neutral-400 mt-1">Configure booking policies</p>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Cancellation Notice (hours)
            </label>
            <p className="text-sm text-neutral-500 mb-3">
              Minimum hours before a session that parents can cancel
            </p>
            <input
              type="number"
              min={0}
              max={72}
              value={cancellationNoticeHours}
              onChange={(e) => setCancellationNoticeHours(Number(e.target.value))}
              className="w-full max-w-xs px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Booking Window (days)
            </label>
            <p className="text-sm text-neutral-500 mb-3">
              How far in advance parents can book sessions
            </p>
            <input
              type="number"
              min={1}
              max={90}
              value={bookingWindowDays}
              onChange={(e) => setBookingWindowDays(Number(e.target.value))}
              className="w-full max-w-xs px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Minimum Booking Notice (hours)
            </label>
            <p className="text-sm text-neutral-500 mb-3">
              Minimum hours before a session that can be booked
            </p>
            <input
              type="number"
              min={0}
              max={48}
              value={minBookingNoticeHours}
              onChange={(e) => setMinBookingNoticeHours(Number(e.target.value))}
              className="w-full max-w-xs px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white"
            />
          </div>

          <div className="pt-4 border-t border-charcoal-800">
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Timezone
            </label>
            <p className="text-white">
              {settings?.timezone || 'America/Los_Angeles'} (Pacific Time)
            </p>
            <p className="text-sm text-neutral-500 mt-1">
              All times are displayed in Pacific Time (Temecula, CA)
            </p>
          </div>
        </div>

        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </form>
    </div>
  );
}
