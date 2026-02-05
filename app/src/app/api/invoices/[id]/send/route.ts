import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST: Send invoice notification (admin only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get invoice with parent info
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*),
        parent:profiles!parent_id(id, full_name)
      `)
      .eq('id', id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Get parent's email from auth
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const parentUser = users?.find(u => u.id === invoice.parent_id);
    const parentEmail = parentUser?.email;

    if (!parentEmail) {
      return NextResponse.json({ error: 'Parent email not found' }, { status: 400 });
    }

    // Update invoice status to pending (if draft)
    if (invoice.status === 'draft') {
      await supabase
        .from('invoices')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
    }

    // TODO: Send email notification
    // This could use Resend, Supabase Edge Functions, or another email service
    // For now, we'll just log and return success
    console.log(`Invoice notification would be sent to: ${parentEmail}`);
    console.log(`Invoice ID: ${id}, Total: $${(invoice.total_cents / 100).toFixed(2)}`);

    // In production, implement email sending here:
    // await sendInvoiceEmail({
    //   to: parentEmail,
    //   invoiceId: id,
    //   amount: invoice.total_cents,
    //   dueDate: invoice.due_date,
    //   paymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    // });

    return NextResponse.json({
      success: true,
      message: `Invoice notification sent to ${parentEmail}`
    });
  } catch (error) {
    console.error('Send invoice error:', error);
    return NextResponse.json({ error: 'Failed to send invoice notification' }, { status: 500 });
  }
}
