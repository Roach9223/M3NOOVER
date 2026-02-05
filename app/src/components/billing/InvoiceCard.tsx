'use client';

import { useState } from 'react';
import { Button } from '@m3noover/ui';
import { formatAmountForDisplay } from '@/lib/format';
import type { Invoice } from '@/types/payment';

interface InvoiceCardProps {
  invoice: Invoice;
  showPayButton?: boolean;
}

export function InvoiceCard({ invoice, showPayButton = false }: InvoiceCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePay = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoice.id }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-neutral-500/10 text-neutral-400',
    pending: 'bg-yellow-500/10 text-yellow-400',
    paid: 'bg-green-500/10 text-green-400',
    overdue: 'bg-red-500/10 text-red-400',
    cancelled: 'bg-neutral-500/10 text-neutral-500',
  };

  return (
    <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <p className="text-white font-medium">
              Invoice #{invoice.id.slice(0, 8)}
            </p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[invoice.status]}`}>
              {invoice.status}
            </span>
          </div>

          {/* Items summary */}
          <div className="text-sm text-neutral-400 mb-2">
            {invoice.items?.map((item, i) => (
              <span key={item.id}>
                {item.description}
                {i < (invoice.items?.length || 0) - 1 && ', '}
              </span>
            ))}
          </div>

          {/* Date info */}
          <p className="text-sm text-neutral-500">
            {invoice.status === 'paid' && invoice.paid_at
              ? `Paid on ${new Date(invoice.paid_at).toLocaleDateString()}`
              : invoice.due_date
              ? `Due ${new Date(invoice.due_date).toLocaleDateString()}`
              : `Created ${new Date(invoice.created_at).toLocaleDateString()}`}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xl font-bold text-white">
            {formatAmountForDisplay(invoice.total_cents)}
          </p>
          {showPayButton && invoice.status === 'pending' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handlePay}
              disabled={isLoading}
              className="mt-2"
            >
              {isLoading ? 'Loading...' : 'Pay Now'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
