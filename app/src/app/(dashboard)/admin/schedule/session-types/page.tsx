'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@m3noover/ui';
import { formatAmountForDisplay } from '@/lib/format';
import type { SessionType } from '@/types/scheduling';

export default function SessionTypesPage() {
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<SessionType | null>(null);

  // Form state
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
    const payload = {
      name,
      description: description || null,
      duration_minutes: durationMinutes,
      max_athletes: maxAthletes,
      price_cents: priceCents,
    };

    try {
      let res;
      if (editingType) {
        res = await fetch(`/api/scheduling/session-types/${editingType.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/scheduling/session-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const updatedType = await res.json();
        if (editingType) {
          setSessionTypes((prev) =>
            prev.map((t) => (t.id === updatedType.id ? updatedType : t))
          );
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
      const res = await fetch(`/api/scheduling/session-types/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSessionTypes((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete session type:', error);
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
        <Link href="/admin/schedule">
          <Button variant="ghost" size="sm">
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Session Types</h1>
          <p className="text-neutral-400 mt-1">Manage training session options</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          Add Session Type
        </Button>
      </div>

      {/* Session Types List */}
      {sessionTypes.length === 0 ? (
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-8 text-center">
          <p className="text-neutral-500">No session types configured.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessionTypes.map((type) => (
            <div
              key={type.id}
              className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{type.name}</h3>
                  {type.description && (
                    <p className="text-neutral-400 mt-1">{type.description}</p>
                  )}
                  <div className="flex gap-4 mt-3 text-sm text-neutral-500">
                    <span>{type.duration_minutes} minutes</span>
                    <span>Max {type.max_athletes} athlete{type.max_athletes > 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-accent-500">
                    {formatAmountForDisplay(type.price_cents)}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEdit(type)}
                      className="text-neutral-400 hover:text-white"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(type.id)}
                      className="text-neutral-400 hover:text-red-400"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-white mb-4">
              {editingType ? 'Edit Session Type' : 'Add Session Type'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g., Individual Training"
                  className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the session"
                  rows={2}
                  className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Duration</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value) as 30 | 45 | 60)}
                    className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Max Athletes</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={maxAthletes}
                    onChange={(e) => setMaxAthletes(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceDollars}
                  onChange={(e) => setPriceDollars(e.target.value)}
                  required
                  placeholder="75.00"
                  className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="flex-1">
                  {editingType ? 'Save Changes' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
