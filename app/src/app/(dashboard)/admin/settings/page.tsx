'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@m3noover/ui';
import { formatAmountForDisplay } from '@/lib/format';
import { format } from 'date-fns';
import type { SchedulingSettings, SessionType, AvailabilityTemplate, AvailabilityException } from '@/types/scheduling';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface SectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, description, icon, defaultOpen = false, children }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center gap-4 text-left hover:bg-charcoal-800/50 transition-colors"
      >
        <div className="p-3 bg-charcoal-800 rounded-lg text-accent-500">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-neutral-400 mt-1">{description}</p>
        </div>
        <svg
          className={`w-5 h-5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 pb-6 border-t border-charcoal-800">
          {children}
        </div>
      )}
    </div>
  );
}

function SchedulingSection() {
  const [settings, setSettings] = useState<SchedulingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    return <div className="py-6 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-500"></div></div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-6">
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">Cancellation Notice (hours)</label>
        <p className="text-sm text-neutral-500 mb-3">Minimum hours before a session that parents can cancel</p>
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
        <label className="block text-sm font-medium text-neutral-300 mb-2">Booking Window (days)</label>
        <p className="text-sm text-neutral-500 mb-3">How far in advance parents can book sessions</p>
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
        <label className="block text-sm font-medium text-neutral-300 mb-2">Minimum Booking Notice (hours)</label>
        <p className="text-sm text-neutral-500 mb-3">Minimum hours before a session that can be booked</p>
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
        <label className="block text-sm font-medium text-neutral-300 mb-2">Timezone</label>
        <p className="text-white">{settings?.timezone || 'America/Los_Angeles'} (Pacific Time)</p>
        <p className="text-sm text-neutral-500 mt-1">All times are displayed in Pacific Time (Temecula, CA)</p>
      </div>
      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </form>
  );
}

function SessionTypesSection() {
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<SessionType | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<30 | 45 | 60>(60);
  const [maxAthletes, setMaxAthletes] = useState(1);
  const [priceDollars, setPriceDollars] = useState('');

  useEffect(() => {
    async function fetchSessionTypes() {
      try {
        const res = await fetch('/api/scheduling/session-types');
        if (res.ok) {
          setSessionTypes(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch session types:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSessionTypes();
  }, []);

  const resetForm = () => {
    setName('');
    setDescription('');
    setDurationMinutes(60);
    setMaxAthletes(1);
    setPriceDollars('');
    setEditingType(null);
  };

  const handleEdit = (type: SessionType) => {
    setEditingType(type);
    setName(type.name);
    setDescription(type.description || '');
    setDurationMinutes(type.duration_minutes);
    setMaxAthletes(type.max_athletes);
    setPriceDollars((type.price_cents / 100).toString());
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(priceDollars) * 100);
    const payload = { name, description: description || null, duration_minutes: durationMinutes, max_athletes: maxAthletes, price_cents: priceCents };
    try {
      let res;
      if (editingType) {
        res = await fetch(`/api/scheduling/session-types/${editingType.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        res = await fetch('/api/scheduling/session-types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      if (res.ok) {
        const updatedType = await res.json();
        if (editingType) {
          setSessionTypes((prev) => prev.map((t) => (t.id === updatedType.id ? updatedType : t)));
        } else {
          setSessionTypes((prev) => [...prev, updatedType]);
        }
        setShowForm(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save session type:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session type?')) return;
    try {
      const res = await fetch(`/api/scheduling/session-types/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSessionTypes((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete session type:', error);
    }
  };

  if (loading) {
    return <div className="py-6 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-500"></div></div>;
  }

  return (
    <div className="pt-6 space-y-4">
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={() => { resetForm(); setShowForm(true); }}>Add Session Type</Button>
      </div>
      {sessionTypes.length === 0 ? (
        <div className="bg-charcoal-800/50 rounded-lg p-6 text-center">
          <p className="text-neutral-500">No session types configured.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessionTypes.map((type) => (
            <div key={type.id} className="bg-charcoal-800/50 rounded-lg p-4 flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-white">{type.name}</h4>
                {type.description && <p className="text-sm text-neutral-400 mt-1">{type.description}</p>}
                <div className="flex gap-4 mt-2 text-sm text-neutral-500">
                  <span>{type.duration_minutes} min</span>
                  <span>Max {type.max_athletes} athlete{type.max_athletes > 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-accent-500">{formatAmountForDisplay(type.price_cents)}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleEdit(type)} className="text-neutral-400 hover:text-white">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(type.id)} className="text-neutral-400 hover:text-red-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-white mb-4">{editingType ? 'Edit Session Type' : 'Add Session Type'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g., Individual Training" className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" rows={2} className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Duration</label>
                  <select value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value) as 30 | 45 | 60)} className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white">
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Max Athletes</label>
                  <input type="number" min={1} max={10} value={maxAthletes} onChange={(e) => setMaxAthletes(Number(e.target.value))} className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Price ($)</label>
                <input type="number" step="0.01" min="0" value={priceDollars} onChange={(e) => setPriceDollars(e.target.value)} required placeholder="75.00" className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500" />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }} className="flex-1">Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1">{editingType ? 'Save Changes' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AvailabilitySection() {
  const [templates, setTemplates] = useState<AvailabilityTemplate[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [showBlockDate, setShowBlockDate] = useState(false);
  const [newDayOfWeek, setNewDayOfWeek] = useState(1);
  const [newStartTime, setNewStartTime] = useState('15:00');
  const [newEndTime, setNewEndTime] = useState('19:00');
  const [blockDate, setBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [templatesRes, exceptionsRes] = await Promise.all([
          fetch('/api/scheduling/availability/templates'),
          fetch('/api/scheduling/availability/exceptions'),
        ]);
        if (templatesRes.ok) setTemplates(await templatesRes.json());
        if (exceptionsRes.ok) setExceptions(await exceptionsRes.json());
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
        body: JSON.stringify({ day_of_week: newDayOfWeek, start_time: newStartTime, end_time: newEndTime }),
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
      const res = await fetch(`/api/scheduling/availability/templates?id=${id}`, { method: 'DELETE' });
      if (res.ok) setTemplates((prev) => prev.filter((t) => t.id !== id));
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
        body: JSON.stringify({ exception_date: blockDate, is_available: false, reason: blockReason || null }),
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
      const res = await fetch(`/api/scheduling/availability/exceptions?id=${id}`, { method: 'DELETE' });
      if (res.ok) setExceptions((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error('Failed to delete exception:', error);
    }
  };

  const templatesByDay = DAYS.map((day, index) => ({
    day,
    dayIndex: index,
    slots: templates.filter((t) => t.day_of_week === index),
  }));

  if (loading) {
    return <div className="py-6 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-500"></div></div>;
  }

  return (
    <div className="pt-6 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-white">Weekly Schedule</h4>
          <Button variant="secondary" size="sm" onClick={() => setShowAddTemplate(true)}>Add Time Slot</Button>
        </div>
        <div className="space-y-2">
          {templatesByDay.map(({ day, slots }) => (
            <div key={day} className="bg-charcoal-800/50 rounded-lg p-3 flex items-center justify-between">
              <p className="font-medium text-white text-sm">{day}</p>
              <div className="flex gap-2 flex-wrap">
                {slots.length === 0 ? (
                  <span className="text-neutral-500 text-sm">No availability</span>
                ) : (
                  slots.map((slot) => (
                    <div key={slot.id} className="flex items-center gap-2 bg-charcoal-700 px-2 py-1 rounded">
                      <span className="text-neutral-300 text-xs">{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                      <button onClick={() => handleDeleteTemplate(slot.id)} className="text-neutral-500 hover:text-red-400">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-white">Blocked Dates</h4>
          <Button variant="secondary" size="sm" onClick={() => setShowBlockDate(true)}>Block a Date</Button>
        </div>
        {exceptions.filter((e) => !e.is_available).length === 0 ? (
          <div className="bg-charcoal-800/50 rounded-lg p-4 text-center">
            <p className="text-neutral-500 text-sm">No blocked dates</p>
          </div>
        ) : (
          <div className="space-y-2">
            {exceptions.filter((e) => !e.is_available).map((exception) => (
              <div key={exception.id} className="bg-charcoal-800/50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{format(new Date(exception.exception_date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}</p>
                  {exception.reason && <p className="text-xs text-neutral-500">{exception.reason}</p>}
                </div>
                <button onClick={() => handleDeleteException(exception.id)} className="text-neutral-500 hover:text-red-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-white mb-4">Add Time Slot</h2>
            <form onSubmit={handleAddTemplate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Day</label>
                <select value={newDayOfWeek} onChange={(e) => setNewDayOfWeek(Number(e.target.value))} className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white">
                  {DAYS.map((day, i) => (<option key={day} value={i}>{day}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Start Time</label>
                  <input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">End Time</label>
                  <input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddTemplate(false)} className="flex-1">Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1">Add Slot</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBlockDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-white mb-4">Block a Date</h2>
            <form onSubmit={handleBlockDate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Date</label>
                <input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} required className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Reason (optional)</label>
                <input type="text" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="e.g., Holiday, Vacation" className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500" />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowBlockDate(false)} className="flex-1">Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1">Block Date</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-neutral-400 mt-1">Configure your M3FIT dashboard</p>
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-4">
        <CollapsibleSection
          title="Scheduling"
          description="Booking policies, cancellation notice, and time windows"
          defaultOpen={true}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        >
          <SchedulingSection />
        </CollapsibleSection>

        <CollapsibleSection
          title="Session Types"
          description="Manage training session types and pricing"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
        >
          <SessionTypesSection />
        </CollapsibleSection>

        <CollapsibleSection
          title="Availability"
          description="Set weekly schedule and blocked dates"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        >
          <AvailabilitySection />
        </CollapsibleSection>

        <CollapsibleSection
          title="Integrations"
          description="Connect Google Calendar and other services"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
        >
          <div className="pt-6">
            <Link
              href="/admin/settings/integrations"
              className="flex items-center gap-3 px-4 py-3 bg-charcoal-800/50 hover:bg-charcoal-700/50 rounded-lg transition-colors"
            >
              <div className="p-2 bg-charcoal-700 rounded-lg">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22 12l-10 10L2 12l10-10z" />
                  <path fill="#34A853" d="M12 22V12l10 10z" />
                  <path fill="#FBBC05" d="M2 12l10 10V12z" />
                  <path fill="#EA4335" d="M12 2v10L2 2z" />
                  <path fill="#FFFFFF" d="M12 2l10 10H12z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Google Calendar</p>
                <p className="text-sm text-neutral-400">Sync bookings to your calendar</p>
              </div>
              <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Go-Live Checklist"
          description="Verify your configuration before launching"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        >
          <div className="pt-6">
            <Link
              href="/admin/settings/go-live"
              className="flex items-center gap-3 px-4 py-3 bg-charcoal-800/50 hover:bg-charcoal-700/50 rounded-lg transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-white">Open Checklist</p>
                <p className="text-sm text-neutral-400">Verify Stripe, Supabase, and other configurations</p>
              </div>
              <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}
