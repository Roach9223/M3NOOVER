'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button } from '@m3noover/ui';
import { EffortRating } from '@/components/session-notes';
import { format } from 'date-fns';
import type { Athlete, AthleteStats, SessionNote } from '@/types/athlete';

export default function AthleteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [stats, setStats] = useState<AthleteStats | null>(null);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [athleteRes, statsRes, notesRes] = await Promise.all([
          fetch(`/api/athletes/${id}`),
          fetch(`/api/athletes/${id}/stats`),
          fetch(`/api/athletes/${id}/notes?limit=10`),
        ]);

        if (athleteRes.ok) {
          setAthlete(await athleteRes.json());
        }
        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
        if (notesRes.ok) {
          setNotes(await notesRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch athlete:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-400">Athlete not found</p>
        <Link href="/athletes">
          <Button variant="secondary" className="mt-4">
            Back to Athletes
          </Button>
        </Link>
      </div>
    );
  }

  const age = athlete.date_of_birth
    ? Math.floor(
        (Date.now() - new Date(athlete.date_of_birth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/athletes">
          <Button variant="ghost" size="sm">
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
        </Link>
      </div>

      {/* Profile Header */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 bg-accent-500/10 rounded-full flex items-center justify-center flex-shrink-0">
            {athlete.profile_image_url ? (
              <img
                src={athlete.profile_image_url}
                alt={athlete.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-accent-500">
                {athlete.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{athlete.name}</h1>
            <div className="flex flex-wrap gap-2 mt-1 text-neutral-400">
              {age !== null && <span>Age {age}</span>}
              {athlete.school && (
                <>
                  {age !== null && <span>•</span>}
                  <span>{athlete.school}</span>
                </>
              )}
            </div>

            {/* Sports badges */}
            {athlete.sports && athlete.sports.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {athlete.sports.map((sport) => (
                  <span
                    key={sport}
                    className="px-3 py-1 text-sm font-medium bg-accent-500/10 text-accent-500 rounded-full"
                  >
                    {sport}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Edit button */}
          <Link href={`/athletes/${id}/edit`}>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{stats.completedSessions}</p>
            <p className="text-sm text-neutral-400 mt-1">Sessions</p>
          </div>
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{stats.currentStreak}</p>
            <p className="text-sm text-neutral-400 mt-1">Week Streak</p>
          </div>
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">
              {stats.averageEffort ? stats.averageEffort.toFixed(1) : '—'}
            </p>
            <p className="text-sm text-neutral-400 mt-1">Avg Effort</p>
          </div>
        </div>
      )}

      {/* Recent Coach Notes */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Coach Notes</h2>
          {notes.length > 0 && (
            <Link
              href={`/athletes/${id}/notes`}
              className="text-sm text-accent-500 hover:text-accent-400"
            >
              View all
            </Link>
          )}
        </div>

        {notes.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">
            No session notes yet. Notes will appear here after training sessions.
          </p>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-charcoal-800/50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm text-neutral-400">
                      {note.booking?.start_time &&
                        format(new Date(note.booking.start_time), 'MMM d, yyyy')}
                      {note.booking?.session_type?.name && (
                        <span> • {note.booking.session_type.name}</span>
                      )}
                    </p>
                  </div>
                  {note.effort_rating && (
                    <EffortRating value={note.effort_rating} readonly size="sm" />
                  )}
                </div>

                <p className="text-white font-medium mb-1">
                  Worked on: {note.worked_on}
                </p>

                {note.progress_observations && (
                  <p className="text-neutral-300 text-sm mb-1">
                    <span className="text-neutral-500">Progress:</span>{' '}
                    {note.progress_observations}
                  </p>
                )}

                {note.focus_areas && (
                  <p className="text-neutral-300 text-sm">
                    <span className="text-neutral-500">Focus next:</span>{' '}
                    {note.focus_areas}
                  </p>
                )}

                {note.needs_attention && (
                  <div className="mt-2 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-400 text-sm">
                    ⚠️ {note.attention_reason || 'Flagged for attention'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
