'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClientListFilters, type PlanFilter } from './ClientListFilters';
import { ClientRow, type ClientData } from './ClientRow';
import { QuickNoteModal } from './QuickNoteModal';
import { SUBSCRIPTION_TIERS } from '@/lib/stripe/products';

interface ClientListProps {
  clients: ClientData[];
}

export function ClientList({ clients }: ClientListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'outstanding' | 'clear'>('all');
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteAthleteId, setNoteAthleteId] = useState<string>();
  const [noteAthleteName, setNoteAthleteName] = useState<string>();

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const parentMatch = client.full_name?.toLowerCase().includes(query);
        const athleteMatch = client.athletes.some((a) =>
          a.name.toLowerCase().includes(query)
        );
        const emailMatch = client.email.toLowerCase().includes(query);
        if (!parentMatch && !athleteMatch && !emailMatch) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        const hasActiveAthletes = client.athletes.some((a) => a.is_active);
        if (statusFilter === 'active' && !hasActiveAthletes) return false;
        if (statusFilter === 'inactive' && hasActiveAthletes) return false;
      }

      // Balance filter
      if (balanceFilter !== 'all') {
        if (balanceFilter === 'outstanding' && client.outstanding_balance <= 0) return false;
        if (balanceFilter === 'clear' && client.outstanding_balance > 0) return false;
      }

      // Plan filter
      if (planFilter !== 'all') {
        if (planFilter === 'no_plan') {
          if (client.subscription_tier) return false;
        } else if (planFilter === 'has_credits') {
          if (!client.session_credits || client.session_credits <= 0) return false;
        } else if (SUBSCRIPTION_TIERS.includes(planFilter)) {
          if (client.subscription_tier !== planFilter) return false;
        }
      }

      return true;
    });
  }, [clients, searchQuery, statusFilter, balanceFilter, planFilter]);

  const handleAddNote = (athleteId: string, athleteName: string) => {
    setNoteAthleteId(athleteId);
    setNoteAthleteName(athleteName);
    setNoteModalOpen(true);
  };

  const handleCloseNote = () => {
    setNoteModalOpen(false);
    setNoteAthleteId(undefined);
    setNoteAthleteName(undefined);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Client button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Clients</h1>
          <p className="text-neutral-400 mt-1">
            {clients.length} {clients.length === 1 ? 'family' : 'families'}
          </p>
        </div>
        <Link
          href="/admin/clients/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-white font-medium rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span className="hidden sm:inline">Add Client</span>
        </Link>
      </div>

      {/* Filters */}
      <ClientListFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        balanceFilter={balanceFilter}
        onBalanceChange={setBalanceFilter}
        planFilter={planFilter}
        onPlanChange={setPlanFilter}
      />

      {/* Client list */}
      <div className="space-y-3">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12 bg-charcoal-900 border border-charcoal-800 rounded-xl">
            <p className="text-neutral-400">
              {clients.length === 0
                ? 'No clients yet. Add your first client to get started.'
                : 'No clients match your filters.'}
            </p>
            {clients.length === 0 && (
              <Link
                href="/admin/clients/new"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white font-medium rounded-lg transition-colors"
              >
                Add First Client
              </Link>
            )}
          </div>
        ) : (
          filteredClients.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              onAddNote={handleAddNote}
            />
          ))
        )}
      </div>

      {/* Quick Note Modal */}
      <QuickNoteModal
        isOpen={noteModalOpen}
        onClose={handleCloseNote}
        athleteId={noteAthleteId}
        athleteName={noteAthleteName}
      />
    </div>
  );
}
