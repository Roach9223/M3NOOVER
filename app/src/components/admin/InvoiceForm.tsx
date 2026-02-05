'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@m3noover/ui';
import { ClientSelector } from './ClientSelector';
import { LineItemEditor } from './LineItemEditor';
import { formatAmountForDisplay } from '@/lib/format';

interface Client {
  id: string;
  full_name: string | null;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
}

interface InvoiceFormProps {
  clients: Client[];
}

export function InvoiceForm({ clients }: InvoiceFormProps) {
  const router = useRouter();
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unit_price_cents: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = items.reduce(
    (sum, item) => sum + item.unit_price_cents * item.quantity,
    0
  );

  const handleSubmit = async (sendEmail: boolean) => {
    setError(null);

    if (!selectedClient) {
      setError('Please select a client');
      return;
    }

    const validItems = items.filter(
      (item) => item.description && item.unit_price_cents > 0
    );

    if (validItems.length === 0) {
      setError('Please add at least one item');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_id: selectedClient,
          due_date: dueDate || undefined,
          items: validItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price_cents: item.unit_price_cents,
          })),
          send_email: sendEmail,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create invoice');
      }

      const invoice = await res.json();

      if (sendEmail) {
        // Send invoice notification
        await fetch(`/api/invoices/${invoice.id}/send`, { method: 'POST' });
      }

      router.push('/admin/invoices');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6 space-y-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Client Selection */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Client
        </label>
        <ClientSelector
          clients={clients}
          value={selectedClient}
          onChange={setSelectedClient}
        />
      </div>

      {/* Due Date */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Due Date (optional)
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full max-w-xs px-4 py-3 bg-charcoal-800 border border-charcoal-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
        />
      </div>

      {/* Line Items */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Items
        </label>
        <LineItemEditor items={items} onChange={setItems} />
      </div>

      {/* Total */}
      <div className="flex items-center justify-between pt-4 border-t border-charcoal-700">
        <p className="text-lg font-semibold text-white">Total</p>
        <p className="text-2xl font-bold text-accent-500">
          {formatAmountForDisplay(total)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-4">
        <Button
          variant="primary"
          onClick={() => handleSubmit(true)}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create & Send'}
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting}
        >
          Save as Draft
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
