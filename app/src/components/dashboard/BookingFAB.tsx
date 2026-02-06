'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface BookingFABProps {
  hasEligibility: boolean;
}

export function BookingFAB({ hasEligibility }: BookingFABProps) {
  const href = hasEligibility ? '/schedule/book' : '/packages';

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.5 }}
      className="fixed bottom-20 right-4 z-30 md:hidden"
    >
      <Link href={href}>
        <button
          className="w-14 h-14 bg-accent-500 hover:bg-accent-600 rounded-full shadow-lg shadow-accent-500/30 flex items-center justify-center text-white transition-colors"
          aria-label={hasEligibility ? 'Book a session' : 'View training plans'}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>
      </Link>
    </motion.div>
  );
}
