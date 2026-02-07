'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@m3noover/ui';
import { AthleteCard } from '@/components/athletes';
import type { Athlete } from '@/types/athlete';

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAthletes() {
      try {
        const res = await fetch('/api/athletes');
        if (res.ok) {
          const data = await res.json();
          setAthletes(data);
        }
      } catch (error) {
        console.error('Failed to fetch athletes:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAthletes();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Athletes</h1>
          <p className="text-neutral-400 mt-1">Manage and track your athletes</p>
        </div>
        <Link href="/athletes/new">
          <Button variant="primary">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Athlete
          </Button>
        </Link>
      </div>

      {/* Athletes List */}
      {athletes.length === 0 ? (
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-charcoal-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No athletes yet</h3>
          <p className="text-neutral-400 mb-6">
            Add someone to get started
          </p>
          <Link href="/athletes/new">
            <Button variant="primary">Add Your First Athlete</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {athletes.map((athlete) => (
            <AthleteCard
              key={athlete.id}
              athlete={athlete}
              href={`/athletes/${athlete.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
