'use client';

import Link from 'next/link';
import { formatAmountForDisplay } from '@/lib/format';
import type { Invoice } from '@/types/payment';

interface InvoiceTableProps {
  invoices: Invoice[];
}

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  const statusColors: Record<string, string> = {
    draft: 'bg-neutral-500/10 text-neutral-400',
    pending: 'bg-yellow-500/10 text-yellow-400',
    paid: 'bg-green-500/10 text-green-400',
    overdue: 'bg-red-500/10 text-red-400',
    cancelled: 'bg-neutral-500/10 text-neutral-500',
  };

  if (invoices.length === 0) {
    return (
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-12 text-center">
        <svg className="w-12 h-12 mx-auto text-neutral-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-neutral-400">No invoices yet</p>
        <p className="text-neutral-500 text-sm mt-1">Create your first invoice to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-charcoal-800">
              <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Client</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Amount</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Status</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Due Date</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-neutral-400">Created</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-neutral-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-charcoal-800 last:border-0 hover:bg-charcoal-800/50">
                <td className="px-6 py-4">
                  <p className="text-white font-medium">
                    {invoice.parent?.full_name || 'Unknown'}
                  </p>
                  <p className="text-sm text-neutral-500">
                    #{invoice.id.slice(0, 8)}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-white font-semibold">
                    {formatAmountForDisplay(invoice.total_cents)}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[invoice.status]}`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-neutral-400">
                  {invoice.due_date
                    ? new Date(invoice.due_date).toLocaleDateString()
                    : '—'}
                </td>
                <td className="px-6 py-4 text-neutral-400">
                  {new Date(invoice.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/admin/invoices/${invoice.id}`}
                    className="text-accent-500 hover:text-accent-400 text-sm font-medium"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
