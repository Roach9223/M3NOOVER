'use client';

import { useState, useEffect } from 'react';
import { QuickNoteForm } from '@/components/session-notes/QuickNoteForm';
import { AthleteQuickSelector } from './AthleteQuickSelector';
import type { SessionNote } from '@/types/athlete';

interface Athlete {
  id: string;
  name: string;
  parent_name?: string;
}

interface QuickNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Optional pre-fill (when opened from session row)
  bookingId?: string;
  athleteId?: string;
  athleteName?: string;
  sessionType?: string;
}

export function QuickNoteModal({
  isOpen,
  onClose,
  bookingId,
  athleteId,
  athleteName,
  sessionType,
}: QuickNoteModalProps) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState(athleteId || '');
  const [selectedAthleteName, setSelectedAthleteName] = useState(athleteName || '');
  const [isLoading, setIsLoading] = useState(false);

  // Load athletes when modal opens without pre-filled athlete
  useEffect(() => {
    if (isOpen && !athleteId) {
      setIsLoading(true);
      fetch('/api/athletes')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const mapped = data.map((a: { id: string; name: string; parent?: { full_name: string | null } }) => ({
              id: a.id,
              name: a.name,
              parent_name: a.parent?.full_name || undefined,
            }));
            setAthletes(mapped);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, athleteId]);

  // Update selected athlete name when selection changes
  useEffect(() => {
    if (selectedAthleteId && athletes.length > 0) {
      const athlete = athletes.find((a) => a.id === selectedAthleteId);
      if (athlete) {
        setSelectedAthleteName(athlete.name);
      }
    }
  }, [selectedAthleteId, athletes]);

  // Reset state when modal closes or props change
  useEffect(() => {
    if (isOpen) {
      setSelectedAthleteId(athleteId || '');
      setSelectedAthleteName(athleteName || '');
    }
  }, [isOpen, athleteId, athleteName]);

  const handleSuccess = (note: SessionNote) => {
    // Show success feedback
    const name = selectedAthleteName || athleteName || 'athlete';
    // Could use a toast library here, for now we just close
    console.log(`Note saved for ${name}`);
    onClose();
  };

  if (!isOpen) return null;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const effectiveAthleteId = athleteId || selectedAthleteId;
  const effectiveAthleteName = athleteName || selectedAthleteName;
  const effectiveBookingId = bookingId || 'quick-note'; // Placeholder for notes without booking

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-charcoal-900 rounded-t-2xl md:rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-charcoal-900 px-6 py-4 border-b border-charcoal-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Quick Note</h2>
            <p className="text-sm text-neutral-400">{today}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Athlete selector (only show if no pre-filled athlete) */}
          {!athleteId && (
            <div className="mb-6">
              <AthleteQuickSelector
                athletes={athletes}
                value={selectedAthleteId}
                onChange={setSelectedAthleteId}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Show form only when athlete is selected */}
          {effectiveAthleteId ? (
            <QuickNoteForm
              bookingId={effectiveBookingId}
              athleteId={effectiveAthleteId}
              athleteName={effectiveAthleteName}
              sessionType={sessionType}
              sessionDate={today}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          ) : (
            <div className="text-center py-8 text-neutral-400">
              {isLoading ? (
                <p>Loading athletes...</p>
              ) : (
                <p>Select an athlete to add a note</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
