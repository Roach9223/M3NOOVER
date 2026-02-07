'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@m3noover/ui';

export default function BookingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Booking page error:', error.message, error.digest);
  }, [error]);

  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-6">
        <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-lg font-semibold text-white mb-2">
          Failed to Load Booking
        </h2>
        <p className="text-neutral-400 text-sm">
          There was an error loading this booking. The booking may still exist.
        </p>
        {error.digest && (
          <p className="text-neutral-600 text-xs mt-3">Error ID: {error.digest}</p>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <Button variant="secondary" onClick={reset}>
          Try Again
        </Button>
        <Link href="/schedule">
          <Button variant="ghost" className="w-full">
            Back to Schedule
          </Button>
        </Link>
      </div>
    </div>
  );
}
