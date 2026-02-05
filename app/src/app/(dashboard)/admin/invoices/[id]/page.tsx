'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@m3noover/ui';
import { formatAmountForDisplay } from '@/lib/format';
import type { Invoice } from '@/types/payment';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReminder = async () => {
    setIsSending(true);
    try {
      const res = await fetch(`/api/invoices/${params.id}/send`, { method: 'POST' });
      if (res.ok) {
        alert('Invoice notification sent!');
        fetchInvoice();
      }
    } catch (error) {
      console.error('Failed to send:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkPaid = async () => {
    try {
      const res = await fetch(`/api/invoices/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });
      if (res.ok) {
        fetchInvoice();
      }
    } catch (error) {
      console.error('Failed to mark paid:', error);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      const res = await fetch(`/api/invoices/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/invoices');
      }
    } catch (error) {
      console.error('Failed to cancel:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-400">Invoice not found</p>
        <Link href="/admin/invoices" className="text-accent-500 hover:underline mt-2 inline-block">
          Back to Invoices
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-neutral-500/10 text-neutral-400',
    pending: 'bg-yellow-500/10 text-yellow-400',
    paid: 'bg-green-500/10 text-green-400',
    overdue: 'bg-red-500/10 text-red-400',
    cancelled: 'bg-neutral-500/10 text-neutral-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/admin/invoices" className="text-neutral-400 hover:text-white text-sm mb-2 inline-block">
            ← Back to Invoices
          </Link>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Invoice #{invoice.id.slice(0, 8)}
          </h1>
          <p className="text-neutral-400 mt-1">
            {invoice.parent?.full_name || 'Unknown Client'}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${statusColors[invoice.status]}`}>
          {invoice.status}
        </span>
      </div>

      {/* Invoice Card */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
        {/* Meta */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-charcoal-800">
          <div>
            <p className="text-sm text-neutral-500">Created</p>
            <p className="text-white">{new Date(invoice.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Due Date</p>
            <p className="text-white">
              {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Not set'}
            </p>
          </div>
          {invoice.paid_at && (
            <div>
              <p className="text-sm text-neutral-500">Paid On</p>
              <p className="text-green-400">{new Date(invoice.paid_at).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-neutral-400 mb-3">Items</h3>
          <div className="space-y-2">
            {invoice.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-charcoal-800 last:border-0">
                <div>
                  <p className="text-white">{item.description}</p>
                  <p className="text-sm text-neutral-500">
                    {item.quantity} × {formatAmountForDisplay(item.unit_price_cents)}
                  </p>
                </div>
                <p className="text-white font-medium">{formatAmountForDisplay(item.total_cents)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-4 border-t border-charcoal-700">
          <p className="text-lg font-semibold text-white">Total</p>
          <p className="text-2xl font-bold text-accent-500">
            {formatAmountForDisplay(invoice.total_cents)}
          </p>
        </div>
      </div>

      {/* Actions */}
      {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            onClick={handleSendReminder}
            disabled={isSending}
          >
            {isSending ? 'Sending...' : invoice.status === 'draft' ? 'Send Invoice' : 'Send Reminder'}
          </Button>
          <Button variant="outline" onClick={handleMarkPaid}>
            Mark as Paid
          </Button>
          <Button variant="ghost" onClick={handleCancel} className="text-red-400 hover:text-red-300">
            Cancel Invoice
          </Button>
        </div>
      )}
    </div>
  );
}
