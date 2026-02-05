import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CreateInvoiceInput } from '@/types/payment';

// GET: List invoices (admin sees all, parent sees own)
export async function GET() {
  try {
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

    const isAdmin = profile?.role === 'admin';

    let query = supabase
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*),
        parent:profiles!parent_id(id, full_name)
      `)
      .order('created_at', { ascending: false });

    // Parents only see their own invoices
    if (!isAdmin) {
      query = query.eq('parent_id', user.id);
    }

    const { data: invoices, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

// POST: Create invoice (admin only)
export async function POST(request: Request) {
  try {
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

    const body: CreateInvoiceInput = await request.json();

    // Validate input
    if (!body.parent_id || !body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'Parent and items required' }, { status: 400 });
    }

    // Calculate totals
    const subtotal = body.items.reduce(
      (sum, item) => sum + item.unit_price_cents * item.quantity,
      0
    );

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        parent_id: body.parent_id,
        status: body.send_email ? 'pending' : 'draft',
        due_date: body.due_date || null,
        subtotal_cents: subtotal,
        total_cents: subtotal, // Could add tax/discounts here
      })
      .select()
      .single();

    if (invoiceError) {
      return NextResponse.json({ error: invoiceError.message }, { status: 500 });
    }

    // Create invoice items
    const itemsToInsert = body.items.map((item) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents,
      total_cents: item.unit_price_cents * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert);

    if (itemsError) {
      // Rollback invoice on items failure
      await supabase.from('invoices').delete().eq('id', invoice.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Fetch complete invoice with items
    const { data: completeInvoice } = await supabase
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*),
        parent:profiles!parent_id(id, full_name)
      `)
      .eq('id', invoice.id)
      .single();

    return NextResponse.json(completeInvoice, { status: 201 });
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
