import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { InvoiceForm } from '@/components/admin/InvoiceForm';

export const metadata = {
  title: 'Create Invoice',
};

export default async function NewInvoicePage() {
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

  // Fetch parents (clients) for dropdown
  const { data: parents } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'parent')
    .order('full_name');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Create Invoice</h1>
        <p className="text-neutral-400 mt-1">Create a new invoice for a client</p>
      </div>

      {/* Form */}
      <InvoiceForm clients={parents || []} />
    </div>
  );
}
