'use client';

import Link from 'next/link';

interface QuickActionsBarProps {
  onAddNote: () => void;
}

export function QuickActionsBar({ onAddNote }: QuickActionsBarProps) {
  return (
    <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-3">
        Quick Actions
      </h3>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onAddNote}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-white font-medium rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Add Note
        </button>

        <Link
          href="/admin/invoices/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-charcoal-800 hover:bg-charcoal-700 text-white font-medium rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          New Invoice
        </Link>

        <Link
          href="/admin/clients/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-charcoal-800 hover:bg-charcoal-700 text-white font-medium rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Add Client
        </Link>
      </div>
    </div>
  );
}
