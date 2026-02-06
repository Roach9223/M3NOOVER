-- M3NOOVER Complete Database Migration
-- Run this file in Supabase SQL Editor to set up all tables
--
-- Tables: profiles, session_types, availability_templates, availability_exceptions,
--         scheduling_settings, bookings, push_subscriptions, athletes, session_notes
--
-- Created: 2024
-- ============================================================================

-- ============================================================================
-- PART 1: USER PROFILES
-- ============================================================================

-- Profiles table extends Supabase auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'parent' CHECK (role IN ('parent', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- PART 2: SCHEDULING SYSTEM
-- ============================================================================

-- Session types (training options)
CREATE TABLE IF NOT EXISTS session_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (30, 45, 60)),
  max_athletes INTEGER NOT NULL DEFAULT 1,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_types_active ON session_types(is_active);

-- Availability templates (recurring weekly schedule)
CREATE TABLE IF NOT EXISTS availability_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_availability_day ON availability_templates(day_of_week);

DROP TRIGGER IF EXISTS availability_templates_updated_at ON availability_templates;
CREATE TRIGGER availability_templates_updated_at
  BEFORE UPDATE ON availability_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Availability exceptions (days off, special hours)
CREATE TABLE IF NOT EXISTS availability_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exception_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN NOT NULL DEFAULT false,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_exception_times CHECK (
    (is_available = false) OR
    (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_availability_exception_date ON availability_exceptions(exception_date);

-- Scheduling settings (business rules)
CREATE TABLE IF NOT EXISTS scheduling_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cancellation_notice_hours INTEGER NOT NULL DEFAULT 24,
  booking_window_days INTEGER NOT NULL DEFAULT 14,
  min_booking_notice_hours INTEGER NOT NULL DEFAULT 2,
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_id UUID, -- Added later via ALTER TABLE after athletes table
  session_type_id UUID NOT NULL REFERENCES session_types(id) ON DELETE RESTRICT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  notes TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES profiles(id),
  cancellation_reason TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_booking_times CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_bookings_parent ON bookings(parent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_session_type ON bookings(session_type_id);

DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- ============================================================================
-- PART 3: ATHLETE TRACKING
-- ============================================================================

-- Athletes (children linked to parent accounts)
CREATE TABLE IF NOT EXISTS athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_of_birth DATE,
  sports TEXT[] DEFAULT '{}',
  school TEXT,
  profile_image_url TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_athletes_parent ON athletes(parent_id);
CREATE INDEX IF NOT EXISTS idx_athletes_active ON athletes(is_active);

DROP TRIGGER IF EXISTS athletes_updated_at ON athletes;
CREATE TRIGGER athletes_updated_at
  BEFORE UPDATE ON athletes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add athlete_id foreign key to bookings now that athletes table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'bookings_athlete_id_fkey'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_athlete_id_fkey
      FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_athlete ON bookings(athlete_id);

-- Session notes (coach observations after each session)
CREATE TABLE IF NOT EXISTS session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES profiles(id),

  -- Quick entry fields
  worked_on TEXT NOT NULL,
  progress_observations TEXT,
  focus_areas TEXT,
  effort_rating INTEGER CHECK (effort_rating IS NULL OR (effort_rating >= 1 AND effort_rating <= 5)),

  -- Flags
  needs_attention BOOLEAN DEFAULT false,
  attention_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_notes_athlete ON session_notes(athlete_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_booking ON session_notes(booking_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_coach ON session_notes(coach_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_attention ON session_notes(needs_attention) WHERE needs_attention = true;

DROP TRIGGER IF EXISTS session_notes_updated_at ON session_notes;
CREATE TRIGGER session_notes_updated_at
  BEFORE UPDATE ON session_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- PART 4: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admin can manage all profiles" ON profiles;
CREATE POLICY "Admin can manage all profiles" ON profiles
  FOR ALL USING (is_admin());

-- ============================================================================
-- SESSION TYPES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view active session types" ON session_types;
CREATE POLICY "Anyone can view active session types" ON session_types
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admin manages session types" ON session_types;
CREATE POLICY "Admin manages session types" ON session_types
  FOR ALL USING (is_admin());

-- ============================================================================
-- AVAILABILITY TEMPLATES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view active templates" ON availability_templates;
CREATE POLICY "Anyone can view active templates" ON availability_templates
  FOR SELECT USING (is_active = true OR is_admin());

DROP POLICY IF EXISTS "Admin manages availability templates" ON availability_templates;
CREATE POLICY "Admin manages availability templates" ON availability_templates
  FOR ALL USING (is_admin());

-- ============================================================================
-- AVAILABILITY EXCEPTIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view exceptions" ON availability_exceptions;
CREATE POLICY "Anyone can view exceptions" ON availability_exceptions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manages exceptions" ON availability_exceptions;
CREATE POLICY "Admin manages exceptions" ON availability_exceptions
  FOR ALL USING (is_admin());

-- ============================================================================
-- SCHEDULING SETTINGS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view settings" ON scheduling_settings;
CREATE POLICY "Anyone can view settings" ON scheduling_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manages settings" ON scheduling_settings;
CREATE POLICY "Admin manages settings" ON scheduling_settings
  FOR ALL USING (is_admin());

-- ============================================================================
-- BOOKINGS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Parents view own bookings" ON bookings;
CREATE POLICY "Parents view own bookings" ON bookings
  FOR SELECT USING (parent_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Parents create own bookings" ON bookings;
CREATE POLICY "Parents create own bookings" ON bookings
  FOR INSERT WITH CHECK (parent_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Parents update own bookings" ON bookings;
CREATE POLICY "Parents update own bookings" ON bookings
  FOR UPDATE USING (parent_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Admin manages all bookings" ON bookings;
CREATE POLICY "Admin manages all bookings" ON bookings
  FOR ALL USING (is_admin());

-- ============================================================================
-- PUSH SUBSCRIPTIONS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users manage own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users manage own push subscriptions" ON push_subscriptions
  FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- ATHLETES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admin manages athletes" ON athletes;
CREATE POLICY "Admin manages athletes" ON athletes
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Parents view own athletes" ON athletes;
CREATE POLICY "Parents view own athletes" ON athletes
  FOR SELECT USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "Parents create own athletes" ON athletes;
CREATE POLICY "Parents create own athletes" ON athletes
  FOR INSERT WITH CHECK (parent_id = auth.uid());

DROP POLICY IF EXISTS "Parents update own athletes" ON athletes;
CREATE POLICY "Parents update own athletes" ON athletes
  FOR UPDATE USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "Parents delete own athletes" ON athletes;
CREATE POLICY "Parents delete own athletes" ON athletes
  FOR DELETE USING (parent_id = auth.uid());

-- ============================================================================
-- SESSION NOTES POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Admin manages session notes" ON session_notes;
CREATE POLICY "Admin manages session notes" ON session_notes
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Parents view own athlete notes" ON session_notes;
CREATE POLICY "Parents view own athlete notes" ON session_notes
  FOR SELECT USING (
    athlete_id IN (SELECT id FROM athletes WHERE parent_id = auth.uid())
  );

-- ============================================================================
-- PART 5: SEED DATA
-- ============================================================================

-- Session Types (M3 training packages)
INSERT INTO session_types (name, description, duration_minutes, max_athletes, price_cents, is_active) VALUES
  ('Speed Training', 'Individual speed and agility training session', 60, 1, 7500, true),
  ('Strength Training', 'Individual strength and conditioning session', 60, 1, 7500, true),
  ('Group Speed', 'Small group speed training (max 4 athletes)', 60, 4, 4000, true),
  ('Assessment', 'Initial athletic assessment and goal setting', 45, 1, 5000, true),
  ('Recovery Session', 'Active recovery and mobility work', 30, 1, 4000, true)
ON CONFLICT DO NOTHING;

-- Default availability (Mon-Fri, 6am-8pm; Sat 8am-2pm)
INSERT INTO availability_templates (day_of_week, start_time, end_time, is_active) VALUES
  (1, '06:00', '20:00', true),  -- Monday
  (2, '06:00', '20:00', true),  -- Tuesday
  (3, '06:00', '20:00', true),  -- Wednesday
  (4, '06:00', '20:00', true),  -- Thursday
  (5, '06:00', '20:00', true),  -- Friday
  (6, '08:00', '14:00', true)   -- Saturday
ON CONFLICT DO NOTHING;

-- Default scheduling settings
INSERT INTO scheduling_settings (cancellation_notice_hours, booking_window_days, min_booking_notice_hours, timezone)
SELECT 24, 14, 2, 'America/Los_Angeles'
WHERE NOT EXISTS (SELECT 1 FROM scheduling_settings);

-- ============================================================================
-- PART 6: USEFUL VIEWS (Optional)
-- ============================================================================

-- View for upcoming bookings with related data
CREATE OR REPLACE VIEW upcoming_bookings AS
SELECT
  b.*,
  st.name as session_type_name,
  st.duration_minutes,
  st.price_cents,
  p.full_name as parent_name,
  p.email as parent_email,
  a.name as athlete_name
FROM bookings b
JOIN session_types st ON b.session_type_id = st.id
JOIN profiles p ON b.parent_id = p.id
LEFT JOIN athletes a ON b.athlete_id = a.id
WHERE b.status IN ('pending', 'confirmed')
  AND b.start_time > NOW()
ORDER BY b.start_time;

-- View for athletes needing attention
CREATE OR REPLACE VIEW athletes_needing_attention AS
SELECT DISTINCT
  a.*,
  p.full_name as parent_name,
  p.email as parent_email,
  sn.attention_reason,
  sn.created_at as flagged_at
FROM athletes a
JOIN profiles p ON a.parent_id = p.id
JOIN session_notes sn ON a.id = sn.athlete_id
WHERE sn.needs_attention = true
ORDER BY sn.created_at DESC;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
--
-- Tables created:
--   - profiles (user accounts)
--   - session_types (training package types)
--   - availability_templates (weekly schedule)
--   - availability_exceptions (days off/special hours)
--   - scheduling_settings (business rules)
--   - bookings (scheduled sessions)
--   - push_subscriptions (web push notifications)
--   - athletes (children linked to parents)
--   - session_notes (coach feedback per session)
--
-- Run this migration in Supabase SQL Editor
-- ============================================================================
