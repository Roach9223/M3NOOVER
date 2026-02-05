'use client';

import Link from 'next/link';
import type { Athlete } from '@/types/athlete';

interface AthleteCardProps {
  athlete: Athlete;
  showParent?: boolean;
  href?: string;
}

export function AthleteCard({ athlete, showParent = false, href }: AthleteCardProps) {
  const age = athlete.date_of_birth
    ? Math.floor(
        (Date.now() - new Date(athlete.date_of_birth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  const content = (
    <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-4 hover:border-charcoal-700 transition-colors">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 bg-accent-500/10 rounded-full flex items-center justify-center flex-shrink-0">
          {athlete.profile_image_url ? (
            <img
              src={athlete.profile_image_url}
              alt={athlete.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-xl font-bold text-accent-500">
              {athlete.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">{athlete.name}</h3>
          <div className="flex flex-wrap gap-2 mt-1 text-sm text-neutral-400">
            {age !== null && <span>Age {age}</span>}
            {athlete.school && (
              <>
                {age !== null && <span>•</span>}
                <span className="truncate">{athlete.school}</span>
              </>
            )}
          </div>

          {/* Sports badges */}
          {athlete.sports && athlete.sports.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {athlete.sports.map((sport) => (
                <span
                  key={sport}
                  className="px-2 py-0.5 text-xs font-medium bg-charcoal-800 text-neutral-300 rounded-full"
                >
                  {sport}
                </span>
              ))}
            </div>
          )}

          {/* Parent name (admin view) */}
          {showParent && athlete.parent?.full_name && (
            <p className="mt-2 text-xs text-neutral-500">
              Parent: {athlete.parent.full_name}
            </p>
          )}
        </div>

        {/* Arrow */}
        <svg
          className="w-5 h-5 text-neutral-500 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
