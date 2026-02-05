'use client';

import { useState, useEffect } from 'react';
import { Button } from '@m3noover/ui';
import { AthleteCard } from '@/components/athletes';
import type { Athlete } from '@/types/athlete';

export default function AdminAthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'attention'>('all');

  useEffect(() => {
    async function fetchAthletes() {
      try {
        const res = await fetch('/api/athletes?include_inactive=true');
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

  // For attention filter, we'd need to fetch from session_notes
  // For simplicity, just showing all athletes for now
  const filteredAthletes = athletes;

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
          <h1 className="text-2xl lg:text-3xl font-bold text-white">All Athletes</h1>
          <p className="text-neutral-400 mt-1">
            {athletes.length} athlete{athletes.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'attention' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('attention')}
          >
            Needs Attention
          </Button>
        </div>
      </div>

      {/* Search (placeholder) */}
      <div>
        <input
          type="text"
          placeholder="Search athletes..."
          className="w-full max-w-md px-4 py-3 bg-charcoal-900 border border-charcoal-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
      </div>

      {/* Athletes List */}
      {filteredAthletes.length === 0 ? (
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-12 text-center">
          <p className="text-neutral-400">No athletes found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAthletes.map((athlete) => (
            <AthleteCard
              key={athlete.id}
              athlete={athlete}
              showParent
              href={`/admin/athletes/${athlete.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
