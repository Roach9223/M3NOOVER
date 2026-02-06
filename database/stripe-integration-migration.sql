-- Stripe Integration Migration
-- Adds stripe_customer_id to profiles, creates session_credits table,
-- and updates subscriptions table for direct Stripe product integration.
-- ============================================================================
-- Run this AFTER billing-migration.sql
-- ============================================================================

-- ============================================================================
-- PART 1: ADD STRIPE CUSTOMER ID TO PROFILES
-- ============================================================================

-- Add stripe_customer_id column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT UNIQUE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);

-- ============================================================================
-- PART 2: SESSION CREDITS TABLE (for session packs: drop-in, 5-pack, 10-pack)
-- ============================================================================

CREATE TABLE IF NOT EXISTS session_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Session count
  total_sessions INTEGER NOT NULL CHECK (total_sessions > 0),
  used_sessions INTEGER NOT NULL DEFAULT 0 CHECK (used_sessions >= 0),

  -- Stripe reference
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,

  -- Product info
  product_type TEXT NOT NULL CHECK (product_type IN ('drop_in', 'five_pack', 'ten_pack')),
  price_cents INTEGER NOT NULL,

  -- Timestamps
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = no expiry

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure used_sessions doesn't exceed total_sessions
  CONSTRAINT valid_session_count CHECK (used_sessions <= total_sessions)
);

CREATE INDEX IF NOT EXISTS idx_session_credits_profile ON session_credits(profile_id);
CREATE INDEX IF NOT EXISTS idx_session_credits_stripe ON session_credits(stripe_payment_intent_id);
-- Partial index for credits with remaining sessions (expiry check done at query time)
CREATE INDEX IF NOT EXISTS idx_session_credits_active ON session_credits(profile_id)
  WHERE used_sessions < total_sessions;

DROP TRIGGER IF EXISTS session_credits_updated_at ON session_credits;
CREATE TRIGGER session_credits_updated_at
  BEFORE UPDATE ON session_credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- PART 3: UPDATE SUBSCRIPTIONS TABLE
-- ============================================================================

-- Add new columns for Stripe product integration
DO $$
BEGIN
  -- Add tier column (matches STRIPE_PRODUCTS keys)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'tier'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN tier TEXT
      CHECK (tier IN ('starter', 'foundation', 'competitor', 'elite'));
  END IF;

  -- Add stripe_price_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'stripe_price_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN stripe_price_id TEXT;
  END IF;

  -- Add sessions_per_week column (NULL for unlimited/elite)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'sessions_per_week'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN sessions_per_week INTEGER;
  END IF;

  -- Add cancel_at_period_end column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'cancel_at_period_end'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT false;
  END IF;

  -- Make package_id nullable (we may not use packages table anymore)
  -- Note: This won't do anything if already nullable, but it's idempotent
  BEGIN
    ALTER TABLE subscriptions ALTER COLUMN package_id DROP NOT NULL;
  EXCEPTION
    WHEN others THEN NULL;
  END;
END $$;

-- Add unique constraint on stripe_subscription_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_stripe_subscription_id_key'
  ) THEN
    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_stripe_subscription_id_key
      UNIQUE (stripe_subscription_id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PART 4: ROW LEVEL SECURITY FOR SESSION_CREDITS
-- ============================================================================

ALTER TABLE session_credits ENABLE ROW LEVEL SECURITY;

-- Parents can view their own session credits
DROP POLICY IF EXISTS "Parents view own session credits" ON session_credits;
CREATE POLICY "Parents view own session credits" ON session_credits
  FOR SELECT USING (profile_id = auth.uid() OR is_admin());

-- Admin can manage all session credits
DROP POLICY IF EXISTS "Admin manages session credits" ON session_credits;
CREATE POLICY "Admin manages session credits" ON session_credits
  FOR ALL USING (is_admin());

-- Service role can manage session credits (for webhooks)
DROP POLICY IF EXISTS "Service role manages session credits" ON session_credits;
CREATE POLICY "Service role manages session credits" ON session_credits
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 5: HELPER FUNCTIONS
-- ============================================================================

-- Get available session credits for a user
CREATE OR REPLACE FUNCTION get_available_credits(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((
    SELECT SUM(total_sessions - used_sessions)
    FROM session_credits
    WHERE profile_id = user_id
      AND used_sessions < total_sessions
      AND (expires_at IS NULL OR expires_at > NOW())
  ), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Use a session credit (called when booking with credits)
CREATE OR REPLACE FUNCTION use_session_credit(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  credit_id UUID;
BEGIN
  -- Find the oldest credit pack with available sessions
  SELECT id INTO credit_id
  FROM session_credits
  WHERE profile_id = user_id
    AND used_sessions < total_sessions
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY purchased_at ASC
  LIMIT 1
  FOR UPDATE;

  IF credit_id IS NULL THEN
    RETURN false;
  END IF;

  -- Increment used_sessions
  UPDATE session_credits
  SET used_sessions = used_sessions + 1
  WHERE id = credit_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 6: GRANTS
-- ============================================================================

GRANT SELECT ON session_credits TO authenticated;
GRANT ALL ON session_credits TO service_role;
GRANT EXECUTE ON FUNCTION get_available_credits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION use_session_credit(UUID) TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
--
-- Summary of changes:
-- 1. Added stripe_customer_id to profiles table
-- 2. Created session_credits table for session packs
-- 3. Added tier, stripe_price_id, sessions_per_week, cancel_at_period_end to subscriptions
-- 4. Created helper functions for session credit management
-- ============================================================================
