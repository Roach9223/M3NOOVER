-- Billing System Migration
-- Tables: packages, subscriptions, invoices, invoice_items
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PACKAGES (Training packages available for purchase)
-- ============================================================================

CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  sessions_per_month INTEGER, -- NULL for unlimited
  is_recurring BOOLEAN NOT NULL DEFAULT true,
  stripe_price_id TEXT, -- Cached Stripe Price ID
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active);

DROP TRIGGER IF EXISTS packages_updated_at ON packages;
CREATE TRIGGER packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- SUBSCRIPTIONS (Active training subscriptions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'paused')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_parent ON subscriptions(parent_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- INVOICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
  tax_cents INTEGER NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  total_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  paid_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_parent ON invoices(parent_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- INVOICE ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PACKAGES POLICIES (Public read, admin write)
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view active packages" ON packages;
CREATE POLICY "Anyone can view active packages" ON packages
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admin manages packages" ON packages;
CREATE POLICY "Admin manages packages" ON packages
  FOR ALL USING (is_admin());

-- ============================================================================
-- SUBSCRIPTIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Parents view own subscriptions" ON subscriptions;
CREATE POLICY "Parents view own subscriptions" ON subscriptions
  FOR SELECT USING (parent_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Admin manages subscriptions" ON subscriptions;
CREATE POLICY "Admin manages subscriptions" ON subscriptions
  FOR ALL USING (is_admin());

-- Allow service role to manage subscriptions (for webhooks)
DROP POLICY IF EXISTS "Service role manages subscriptions" ON subscriptions;
CREATE POLICY "Service role manages subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- INVOICES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Parents view own invoices" ON invoices;
CREATE POLICY "Parents view own invoices" ON invoices
  FOR SELECT USING (parent_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Admin manages invoices" ON invoices;
CREATE POLICY "Admin manages invoices" ON invoices
  FOR ALL USING (is_admin());

-- Allow service role to manage invoices (for webhooks)
DROP POLICY IF EXISTS "Service role manages invoices" ON invoices;
CREATE POLICY "Service role manages invoices" ON invoices
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- INVOICE ITEMS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Parents view own invoice items" ON invoice_items;
CREATE POLICY "Parents view own invoice items" ON invoice_items
  FOR SELECT USING (
    invoice_id IN (SELECT id FROM invoices WHERE parent_id = auth.uid())
    OR is_admin()
  );

DROP POLICY IF EXISTS "Admin manages invoice items" ON invoice_items;
CREATE POLICY "Admin manages invoice items" ON invoice_items
  FOR ALL USING (is_admin());

-- Allow service role to manage invoice items (for webhooks)
DROP POLICY IF EXISTS "Service role manages invoice items" ON invoice_items;
CREATE POLICY "Service role manages invoice items" ON invoice_items
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Training packages
INSERT INTO packages (name, description, price_cents, sessions_per_month, is_recurring, is_active) VALUES
  ('M3 Foundation', '2 training sessions per week - Perfect for getting started', 30000, 8, true, true),
  ('M3 Competitor', '4 training sessions per week - For serious athletes', 50000, 16, true, true),
  ('M3 Elite', 'Unlimited training sessions - Maximum development', 75000, NULL, true, true),
  ('Drop-In Session', 'Single training session - No commitment', 7500, NULL, false, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON packages TO authenticated;
GRANT SELECT ON subscriptions TO authenticated;
GRANT SELECT ON invoices TO authenticated;
GRANT SELECT ON invoice_items TO authenticated;

GRANT ALL ON packages TO service_role;
GRANT ALL ON subscriptions TO service_role;
GRANT ALL ON invoices TO service_role;
GRANT ALL ON invoice_items TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
