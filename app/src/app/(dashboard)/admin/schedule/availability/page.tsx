'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@m3noover/ui';
import { format } from 'date-fns';
import type { AvailabilityTemplate, AvailabilityException } from '@/types/scheduling';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityPage() {
  const [templates, setTemplates] = useState<AvailabilityTemplate[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [showBlockDate, setShowBlockDate] = useState(false);

  // New template form
  const [newDayOfWeek, setNewDayOfWeek] = useState(1);
  const [newStartTime, setNewStartTime] = useState('15:00');
  const [newEndTime, setNewEndTime] = useState('19:00');

  // Block date form
  const [blockDate, setBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [templatesRes, exceptionsRes] = await Promise.all([
          fetch('/api/scheduling/availability/templates'),
          fetch('/api/scheduling/availability/exceptions'),
        ]);

        if (templatesRes.ok) {
          setTemplates(await templatesRes.json());
        }
        if (exceptionsRes.ok) {
          setExceptions(await exceptionsRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch availability:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/scheduling/availability/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_of_week: newDayOfWeek,
          start_time: newStartTime,
          end_time: newEndTime,
        }),
      });

      if (res.ok) {
        const newTemplate = await res.json();
        setTemplates((prev) => [...prev, newTemplate]);
        setShowAddTemplate(false);
      }
    } catch (error) {
      console.error('Failed to add template:', error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const res = await fetch(`/api/scheduling/availability/templates?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleBlockDate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/scheduling/availability/exceptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exception_date: blockDate,
          is_available: false,
          reason: blockReason || null,
        }),
      });

      if (res.ok) {
        const newException = await res.json();
        setExceptions((prev) => [...prev, newException]);
        setShowBlockDate(false);
        setBlockDate('');
        setBlockReason('');
      }
    } catch (error) {
      console.error('Failed to block date:', error);
    }
  };

  const handleDeleteException = async (id: string) => {
    try {
      const res = await fetch(`/api/scheduling/availability/exceptions?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setExceptions((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete exception:', error);
    }
  };

  // Group templates by day
  const templatesByDay = DAYS.map((day, index) => ({
    day,
    dayIndex: index,
    slots: templates.filter((t) => t.day_of_week === index),
  }));

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
        <Link href="/admin/schedule">
          <Button variant="ghost" size="sm">
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Availability Settings</h1>
          <p className="text-neutral-400 mt-1">Set your weekly schedule and block dates</p>
        </div>
      </div>

      {/* Weekly Schedule */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Weekly Schedule</h2>
          <Button variant="secondary" size="sm" onClick={() => setShowAddTemplate(true)}>
            Add Time Slot
          </Button>
        </div>

        <div className="space-y-3">
          {templatesByDay.map(({ day, slots }) => (
            <div
              key={day}
              className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-white">{day}</p>
                <div className="flex gap-2 flex-wrap">
                  {slots.length === 0 ? (
                    <span className="text-neutral-500 text-sm">No availability</span>
                  ) : (
                    slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center gap-2 bg-charcoal-800 px-3 py-1 rounded-lg"
                      >
                        <span className="text-neutral-300 text-sm">
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </span>
                        <button
                          onClick={() => handleDeleteTemplate(slot.id)}
                          className="text-neutral-500 hover:text-red-400"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Blocked Dates */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Blocked Dates</h2>
          <Button variant="secondary" size="sm" onClick={() => setShowBlockDate(true)}>
            Block a Date
          </Button>
        </div>

        {exceptions.filter((e) => !e.is_available).length === 0 ? (
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6 text-center">
            <p className="text-neutral-500">No blocked dates</p>
          </div>
        ) : (
          <div className="space-y-2">
            {exceptions
              .filter((e) => !e.is_available)
              .map((exception) => (
                <div
                  key={exception.id}
                  className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white font-medium">
                      {format(new Date(exception.exception_date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                    </p>
                    {exception.reason && (
                      <p className="text-sm text-neutral-500">{exception.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteException(exception.id)}
                    className="text-neutral-500 hover:text-red-400"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Add Template Modal */}
      {showAddTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-white mb-4">Add Time Slot</h2>
            <form onSubmit={handleAddTemplate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Day</label>
                <select
                  value={newDayOfWeek}
                  onChange={(e) => setNewDayOfWeek(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white"
                >
                  {DAYS.map((day, i) => (
                    <option key={day} value={i}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">End Time</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddTemplate(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="flex-1">
                  Add Slot
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block Date Modal */}
      {showBlockDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-white mb-4">Block a Date</h2>
            <form onSubmit={handleBlockDate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Date</label>
                <input
                  type="date"
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Reason (optional)</label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g., Holiday, Vacation"
                  className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowBlockDate(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="flex-1">
                  Block Date
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
