'use client';

import { useState } from 'react';
import { Button } from '@m3noover/ui';
import { EffortRating } from './EffortRating';
import type { EffortRating as EffortRatingType, SessionNote } from '@/types/athlete';

interface QuickNoteFormProps {
  bookingId: string;
  athleteId: string;
  athleteName: string;
  sessionType?: string;
  sessionDate?: string;
  existingNote?: SessionNote;
  onSuccess?: (note: SessionNote) => void;
  onCancel?: () => void;
}

export function QuickNoteForm({
  bookingId,
  athleteId,
  athleteName,
  sessionType,
  sessionDate,
  existingNote,
  onSuccess,
  onCancel,
}: QuickNoteFormProps) {
  const isEditing = !!existingNote;

  const [workedOn, setWorkedOn] = useState(existingNote?.worked_on || '');
  const [progressObservations, setProgressObservations] = useState(
    existingNote?.progress_observations || ''
  );
  const [focusAreas, setFocusAreas] = useState(existingNote?.focus_areas || '');
  const [effortRating, setEffortRating] = useState<EffortRatingType | null>(
    existingNote?.effort_rating || null
  );
  const [needsAttention, setNeedsAttention] = useState(existingNote?.needs_attention || false);
  const [attentionReason, setAttentionReason] = useState(existingNote?.attention_reason || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!workedOn.trim()) {
      setError('Please describe what was worked on');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        booking_id: bookingId,
        athlete_id: athleteId,
        worked_on: workedOn.trim(),
        progress_observations: progressObservations.trim() || null,
        focus_areas: focusAreas.trim() || null,
        effort_rating: effortRating,
        needs_attention: needsAttention,
        attention_reason: needsAttention ? attentionReason.trim() : null,
      };

      const url = isEditing
        ? `/api/session-notes/${existingNote.id}`
        : '/api/session-notes';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save note');
      }

      const savedNote = await res.json();
      onSuccess?.(savedNote);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header info */}
      <div className="bg-charcoal-800 rounded-lg p-3">
        <p className="text-white font-medium">{athleteName}</p>
        {(sessionType || sessionDate) && (
          <p className="text-sm text-neutral-400">
            {sessionType && <span>{sessionType}</span>}
            {sessionType && sessionDate && <span> • </span>}
            {sessionDate && <span>{sessionDate}</span>}
          </p>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Worked On - Required */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          What we worked on <span className="text-red-400">*</span>
        </label>
        <textarea
          value={workedOn}
          onChange={(e) => setWorkedOn(e.target.value)}
          placeholder="e.g., First-step explosiveness, lateral movement drills..."
          rows={2}
          className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
          required
          autoFocus
        />
      </div>

      {/* Progress Observations */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Progress observations
        </label>
        <textarea
          value={progressObservations}
          onChange={(e) => setProgressObservations(e.target.value)}
          placeholder="What improvements did you notice?"
          rows={2}
          className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
        />
      </div>

      {/* Focus Areas */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Focus areas for next time
        </label>
        <textarea
          value={focusAreas}
          onChange={(e) => setFocusAreas(e.target.value)}
          placeholder="What should we work on next session?"
          rows={2}
          className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
        />
      </div>

      {/* Effort Rating */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Effort rating
        </label>
        <EffortRating value={effortRating} onChange={setEffortRating} size="lg" />
      </div>

      {/* Needs Attention Flag */}
      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={needsAttention}
            onChange={(e) => setNeedsAttention(e.target.checked)}
            className="w-5 h-5 rounded border-charcoal-600 bg-charcoal-800 text-accent-500 focus:ring-accent-500 focus:ring-offset-0"
          />
          <span className="text-sm font-medium text-neutral-300">
            Flag for attention
          </span>
        </label>

        {needsAttention && (
          <textarea
            value={attentionReason}
            onChange={(e) => setAttentionReason(e.target.value)}
            placeholder="Why does this athlete need attention?"
            rows={2}
            className="w-full px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
          />
        )}
      </div>

      {/* Actions - Sticky on mobile */}
      <div className="flex gap-3 pt-4 sticky bottom-0 bg-charcoal-900 py-4 -mx-4 px-4 border-t border-charcoal-800 md:static md:bg-transparent md:py-0 md:mx-0 md:px-0 md:border-0">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Note' : 'Save Note'}
        </Button>
      </div>
    </form>
  );
}
