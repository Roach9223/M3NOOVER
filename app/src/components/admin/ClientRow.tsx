'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatAmountForDisplay } from '@/lib/format';
import { STRIPE_PRODUCTS, type SubscriptionTier } from '@/lib/stripe/products';

export interface ClientData {
  id: string;
  full_name: string | null;
  email: string;
  stripe_customer_id?: string | null;
  athletes: {
    id: string;
    name: string;
    is_active: boolean;
  }[];
  outstanding_balance: number;
  subscription_status?: string | null;
  subscription_tier?: SubscriptionTier | null;
  session_credits?: number;
}

const TIER_BADGE_COLORS: Record<SubscriptionTier, { bg: string; text: string }> = {
  starter: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
  foundation: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  competitor: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  elite: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
};

interface ClientRowProps {
  client: ClientData;
  onAddNote: (athleteId: string, athleteName: string) => void;
}

export function ClientRow({ client, onAddNote }: ClientRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeAthletes = client.athletes.filter((a) => a.is_active);
  const athleteNames = activeAthletes.map((a) => a.name).join(', ') || 'No athletes';
  const hasOutstanding = client.outstanding_balance > 0;

  const initials = (client.full_name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl overflow-hidden">
      {/* Main row - clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-charcoal-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 bg-accent-500/20 rounded-full flex items-center justify-center text-accent-500 font-semibold">
            {initials}
          </div>

          {/* Info */}
          <div>
            <p className="font-medium text-white">
              {client.full_name || 'Unknown'}
            </p>
            <p className="text-sm text-neutral-400">{athleteNames}</p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Status indicators */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Subscription Tier Badge */}
            {client.subscription_tier ? (
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  TIER_BADGE_COLORS[client.subscription_tier].bg
                } ${TIER_BADGE_COLORS[client.subscription_tier].text}`}
              >
                {STRIPE_PRODUCTS.subscriptions[client.subscription_tier].name}
              </span>
            ) : (
              <span className="text-xs px-2 py-1 rounded-full bg-neutral-500/20 text-neutral-500">
                No Plan
              </span>
            )}
            {/* Session Credits */}
            {client.session_credits && client.session_credits > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-accent-500/20 text-accent-400">
                {client.session_credits} credit{client.session_credits !== 1 ? 's' : ''}
              </span>
            )}
            {/* Outstanding Balance */}
            {hasOutstanding && (
              <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                {formatAmountForDisplay(client.outstanding_balance)} due
              </span>
            )}
          </div>

          {/* Expand icon */}
          <svg
            className={`w-5 h-5 text-neutral-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-charcoal-800">
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Link
              href={`/admin/clients/${client.id}`}
              className="flex items-center gap-2 px-3 py-2 bg-charcoal-800 hover:bg-charcoal-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              View Profile
            </Link>
            <Link
              href={`/admin/invoices/new?client=${client.id}`}
              className="flex items-center gap-2 px-3 py-2 bg-charcoal-800 hover:bg-charcoal-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Create Invoice
            </Link>
          </div>

          {/* Athletes list with note buttons */}
          {activeAthletes.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
                Athletes
              </p>
              <div className="space-y-2">
                {activeAthletes.map((athlete) => (
                  <div
                    key={athlete.id}
                    className="flex items-center justify-between p-3 bg-charcoal-800/50 rounded-lg"
                  >
                    <span className="text-white">{athlete.name}</span>
                    <button
                      onClick={() => onAddNote(athlete.id, athlete.name)}
                      className="px-3 py-1 text-xs font-medium bg-accent-500/20 text-accent-400 rounded-lg hover:bg-accent-500/30 transition-colors"
                    >
                      Add Note
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact info */}
          <div className="mt-4 text-sm text-neutral-400">
            <p>{client.email}</p>
          </div>
        </div>
      )}
    </div>
  );
}
