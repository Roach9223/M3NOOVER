'use client';

import { formatAmountForDisplay } from '@/lib/format';
import type { SessionType } from '@/types/scheduling';

interface SessionTypeSelectorProps {
  sessionTypes: SessionType[];
  selectedId?: string;
  onSelect: (sessionType: SessionType) => void;
}

export function SessionTypeSelector({
  sessionTypes,
  selectedId,
  onSelect,
}: SessionTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sessionTypes.map((type) => (
        <button
          key={type.id}
          onClick={() => onSelect(type)}
          className={`p-6 rounded-xl text-left transition-all ${
            selectedId === type.id
              ? 'bg-accent-500/20 border-2 border-accent-500'
              : 'bg-charcoal-900 border-2 border-charcoal-800 hover:border-charcoal-700'
          }`}
        >
          <h3 className="text-lg font-semibold text-white mb-2">{type.name}</h3>
          {type.description && (
            <p className="text-sm text-neutral-400 mb-4">{type.description}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-neutral-400">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {type.duration_minutes} min
              </span>
              {type.max_athletes > 1 && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  Max {type.max_athletes}
                </span>
              )}
            </div>
            <p className="text-xl font-bold text-accent-500">
              {formatAmountForDisplay(type.price_cents)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
