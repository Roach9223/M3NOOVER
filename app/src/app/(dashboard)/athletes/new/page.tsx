'use client';

import Link from 'next/link';
import { Button } from '@m3noover/ui';
import { AthleteForm } from '@/components/athletes';

export default function NewAthletePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
        <div>
          <h1 className="text-2xl font-bold text-white">Add Athlete</h1>
          <p className="text-neutral-400 mt-1">Add a new athlete to track their progress</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
        <AthleteForm />
      </div>
    </div>
  );
}
