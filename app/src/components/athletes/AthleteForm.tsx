'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@m3noover/ui';
import type { Athlete } from '@/types/athlete';

interface AthleteFormProps {
  athlete?: Athlete;
  onSuccess?: (athlete: Athlete) => void;
}

const COMMON_SPORTS = [
  'Baseball',
  'Basketball',
  'Football',
  'Soccer',
  'Volleyball',
  'Softball',
  'Track & Field',
  'Cross Country',
  'Swimming',
  'Tennis',
  'Golf',
  'Wrestling',
  'Lacrosse',
];

export function AthleteForm({ athlete, onSuccess }: AthleteFormProps) {
  const router = useRouter();
  const isEditing = !!athlete;

  const [name, setName] = useState(athlete?.name || '');
  const [dateOfBirth, setDateOfBirth] = useState(athlete?.date_of_birth || '');
  const [school, setSchool] = useState(athlete?.school || '');
  const [sports, setSports] = useState<string[]>(athlete?.sports || []);
  const [customSport, setCustomSport] = useState('');
  const [notes, setNotes] = useState(athlete?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleSport = (sport: string) => {
    setSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const handleAddCustomSport = () => {
    const trimmed = customSport.trim();
    if (trimmed && !sports.includes(trimmed)) {
      setSports((prev) => [...prev, trimmed]);
      setCustomSport('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        date_of_birth: dateOfBirth || null,
        school: school.trim() || null,
        sports,
        notes: notes.trim() || null,
      };

      const url = isEditing ? `/api/athletes/${athlete.id}` : '/api/athletes';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save athlete');
      }

      const savedAthlete = await res.json();

      if (onSuccess) {
        onSuccess(savedAthlete);
      } else {
        router.push('/athletes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save athlete');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Athlete's full name"
          className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
          required
        />
      </div>

      {/* Date of Birth */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Date of Birth
        </label>
        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
      </div>

      {/* School */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          School
        </label>
        <input
          type="text"
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          placeholder="School name"
          className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
      </div>

      {/* Sports */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Sports
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {COMMON_SPORTS.map((sport) => (
            <button
              key={sport}
              type="button"
              onClick={() => handleToggleSport(sport)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                sports.includes(sport)
                  ? 'bg-accent-500 text-white'
                  : 'bg-charcoal-800 text-neutral-300 hover:bg-charcoal-700'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>
        {/* Custom sport input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customSport}
            onChange={(e) => setCustomSport(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomSport();
              }
            }}
            placeholder="Add other sport"
            className="flex-1 px-4 py-2 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddCustomSport}
            disabled={!customSport.trim()}
          >
            Add
          </Button>
        </div>
        {/* Selected sports that aren't in common list */}
        {sports.filter((s) => !COMMON_SPORTS.includes(s)).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {sports
              .filter((s) => !COMMON_SPORTS.includes(s))
              .map((sport) => (
                <button
                  key={sport}
                  type="button"
                  onClick={() => handleToggleSport(sport)}
                  className="px-3 py-1.5 text-sm rounded-full bg-accent-500 text-white"
                >
                  {sport} ×
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional information about the athlete"
          rows={3}
          className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Athlete'}
        </Button>
      </div>
    </form>
  );
}
