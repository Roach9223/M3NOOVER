'use client';

import { formatTime } from '@/lib/format';

export interface SessionData {
  id: string;
  start_time: string;
  status: string;
  athlete_name: string;
  session_type_name: string | null;
  duration_minutes?: number;
}

interface SessionRowProps {
  session: SessionData;
  onMarkComplete: (sessionId: string) => void;
  onAddNote: (session: SessionData) => void;
  isLoading?: boolean;
}

export function SessionRow({
  session,
  onMarkComplete,
  onAddNote,
  isLoading,
}: SessionRowProps) {
  const initials = session.athlete_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isCompleted = session.status === 'completed';
  const isPast = new Date(session.start_time) < new Date();

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
        isCompleted
          ? 'bg-green-500/10 border border-green-500/20'
          : 'bg-charcoal-800/50 hover:bg-charcoal-800'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
            isCompleted
              ? 'bg-green-500/20 text-green-400'
              : 'bg-accent-500/20 text-accent-500'
          }`}
        >
          {initials}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-white">{session.athlete_name}</p>
            {isCompleted && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                Done
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-400">
            {session.session_type_name || 'Training Session'}
          </p>
        </div>
      </div>

      {/* Time and Actions */}
      <div className="flex items-center gap-3">
        <div className="text-right mr-2">
          <p className="text-white font-medium">
            {formatTime(session.start_time)}
          </p>
          {session.duration_minutes && (
            <p className="text-sm text-neutral-400">
              {session.duration_minutes} min
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isCompleted && isPast && (
            <button
              onClick={() => onMarkComplete(session.id)}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
            >
              Complete
            </button>
          )}
          <button
            onClick={() => onAddNote(session)}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium bg-accent-500/20 text-accent-400 rounded-lg hover:bg-accent-500/30 transition-colors disabled:opacity-50"
          >
            Note
          </button>
        </div>
      </div>
    </div>
  );
}
