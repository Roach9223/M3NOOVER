'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button } from '@m3noover/ui';
import { EffortRating } from '@/components/session-notes';
import { format } from 'date-fns';
import type { Athlete, AthleteStats, SessionNote } from '@/types/athlete';
import type { Booking } from '@/types/scheduling';

interface ParentInfo {
  id: string;
  full_name: string | null;
  email?: string;
  phone?: string;
}

export default function AdminAthleteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [parent, setParent] = useState<ParentInfo | null>(null);
  const [stats, setStats] = useState<AthleteStats | null>(null);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
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
          const athleteData = await athleteRes.json();
          setAthlete(athleteData);

          // If athlete has parent info, set it
          if (athleteData.parent) {
            setParent(athleteData.parent);
          }

          // Fetch parent's bookings (session history)
          if (athleteData.parent_id) {
            const bookingsRes = await fetch(`/api/scheduling/bookings?parent_id=${athleteData.parent_id}`);
            if (bookingsRes.ok) {
              setBookings(await bookingsRes.json());
            }
          }
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
        <Link href="/admin/athletes">
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

  const pastSessions = bookings.filter(
    (b) => b.status === 'completed' || new Date(b.start_time) < new Date()
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/athletes">
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{athlete.name}</h1>
              {!athlete.is_active && (
                <span className="px-2 py-0.5 text-xs font-medium bg-neutral-500/10 text-neutral-400 rounded-full">
                  Inactive
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-1 text-neutral-400">
              {age !== null && <span>Age {age}</span>}
              {athlete.school && (
                <>
                  {age !== null && <span>-</span>}
                  <span>{athlete.school}</span>
                </>
              )}
              {athlete.date_of_birth && (
                <>
                  <span>-</span>
                  <span>DOB: {format(new Date(athlete.date_of_birth), 'MMM d, yyyy')}</span>
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
          <Link href={`/admin/athletes/${id}/edit`}>
            <Button variant="outline" size="sm">
              Edit Athlete
            </Button>
          </Link>
        </div>
      </div>

      {/* Parent Contact Info */}
      {parent && (
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Parent/Guardian Contact</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{parent.full_name || 'Unknown'}</p>
              {parent.email && (
                <p className="text-neutral-400 text-sm">{parent.email}</p>
              )}
              {parent.phone && (
                <p className="text-neutral-400 text-sm">{parent.phone}</p>
              )}
            </div>
            <Link href={`/admin/clients/${parent.id}`}>
              <Button variant="ghost" size="sm">
                View Client Profile
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              {stats.averageEffort ? stats.averageEffort.toFixed(1) : '-'}
            </p>
            <p className="text-sm text-neutral-400 mt-1">Avg Effort</p>
          </div>
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{stats.longestStreak}</p>
            <p className="text-sm text-neutral-400 mt-1">Best Streak</p>
          </div>
        </div>
      )}

      {/* Session History */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Session History</h2>
        {pastSessions.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">
            No session history yet.
          </p>
        ) : (
          <div className="space-y-2">
            {pastSessions.slice(0, 10).map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between py-3 border-b border-charcoal-800 last:border-0"
              >
                <div>
                  <p className="text-white">
                    {format(new Date(booking.start_time), 'EEE, MMM d, yyyy')}
                  </p>
                  <p className="text-sm text-neutral-400">
                    {format(new Date(booking.start_time), 'h:mm a')} - {booking.session_type?.name || 'Training'}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    booking.status === 'completed'
                      ? 'bg-green-500/10 text-green-400'
                      : booking.status === 'no_show'
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-neutral-500/10 text-neutral-400'
                  }`}
                >
                  {booking.status.replace('_', ' ')}
                </span>
              </div>
            ))}
            {pastSessions.length > 10 && (
              <p className="text-neutral-500 text-sm text-center pt-2">
                + {pastSessions.length - 10} more sessions
              </p>
            )}
          </div>
        )}
      </div>

      {/* Coach Session Notes */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Coach Notes</h2>
          <Link href={`/admin/athletes/${id}/notes`}>
            <Button variant="ghost" size="sm">
              View All Notes
            </Button>
          </Link>
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
                        <span> - {note.booking.session_type.name}</span>
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
                    Flagged: {note.attention_reason || 'Needs attention'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes about athlete (internal) */}
      {athlete.notes && (
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Internal Notes</h2>
          <p className="text-neutral-300 whitespace-pre-wrap">{athlete.notes}</p>
        </div>
      )}
    </div>
  );
}
