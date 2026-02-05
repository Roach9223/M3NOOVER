'use client';

import { useState } from 'react';
import { SessionRow, type SessionData } from './SessionRow';

interface TodayAtAGlanceProps {
  sessions: SessionData[];
  onMarkComplete: (sessionId: string) => Promise<void>;
  onAddNote: (session: SessionData) => void;
}

export function TodayAtAGlance({
  sessions,
  onMarkComplete,
  onAddNote,
}: TodayAtAGlanceProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const completedCount = sessions.filter((s) => s.status === 'completed').length;

  const handleMarkComplete = async (sessionId: string) => {
    setLoadingId(sessionId);
    try {
      await onMarkComplete(sessionId);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-charcoal-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white uppercase tracking-wide">
              Today at a Glance
            </h2>
            <p className="text-sm text-neutral-400 mt-0.5">{today}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{sessions.length}</p>
            <p className="text-xs text-neutral-400">
              {completedCount}/{sessions.length} done
            </p>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="p-4 space-y-3">
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-neutral-400">No sessions scheduled for today</p>
          </div>
        ) : (
          sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              onMarkComplete={handleMarkComplete}
              onAddNote={onAddNote}
              isLoading={loadingId === session.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
