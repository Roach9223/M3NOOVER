'use client';

import type { EffortRating as EffortRatingType } from '@/types/athlete';

interface EffortRatingProps {
  value: EffortRatingType | null;
  onChange?: (rating: EffortRatingType | null) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function EffortRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: EffortRatingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const handleClick = (rating: EffortRatingType) => {
    if (readonly || !onChange) return;
    // Toggle off if clicking same rating
    if (value === rating) {
      onChange(null);
    } else {
      onChange(rating);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {([1, 2, 3, 4, 5] as EffortRatingType[]).map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => handleClick(rating)}
          disabled={readonly}
          className={`${sizeClasses[size]} transition-colors ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          }`}
          aria-label={`${rating} star${rating > 1 ? 's' : ''}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill={value && rating <= value ? '#f59e0b' : 'none'}
            stroke={value && rating <= value ? '#f59e0b' : '#6b7280'}
            strokeWidth={2}
            className="w-full h-full"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
