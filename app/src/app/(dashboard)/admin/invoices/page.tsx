import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@m3noover/ui';
import { InvoiceTable } from '@/components/admin/InvoiceTable';

export const metadata = {
  title: 'Invoices',
};

export default async function AdminInvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Fetch invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      *,
      items:invoice_items(*),
      parent:profiles!parent_id(id, full_name)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Invoices</h1>
          <p className="text-neutral-400 mt-1">Manage client invoices</p>
        </div>
        <Link href="/admin/invoices/new">
          <Button variant="primary">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Invoices Table */}
      <InvoiceTable invoices={invoices || []} />
    </div>
  );
}
