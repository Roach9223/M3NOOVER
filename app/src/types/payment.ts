export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'paused';

export interface Package {
  id: string;
  name: string;
  description: string | null;
  sessions_per_week: number | null;
  price_cents: number;
  stripe_price_id: string | null;
  is_recurring: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Invoice {
  id: string;
  parent_id: string;
  status: InvoiceStatus;
  due_date: string | null;
  subtotal_cents: number;
  total_cents: number;
  stripe_invoice_id: string | null;
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
  parent?: { id: string; full_name: string | null; email?: string };
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  parent_id: string;
  package_id?: string;
  tier?: string;
  sessions_per_week?: number | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
  package?: Package;
  parent?: { id: string; full_name: string | null };
}

export interface CreateInvoiceInput {
  parent_id: string;
  due_date?: string;
  items: {
    description: string;
    quantity: number;
    unit_price_cents: number;
  }[];
  send_email?: boolean;
}

export interface CreateInvoiceItemInput {
  description: string;
  quantity: number;
  unit_price_cents: number;
}
