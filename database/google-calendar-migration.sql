-- Google Calendar Integration Migration
-- Run this migration in Supabase SQL editor

-- Table: admin_integrations (stores OAuth tokens for admin integrations)
CREATE TABLE admin_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_type TEXT NOT NULL,
  encrypted_access_token TEXT,
  encrypted_refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ,
  account_email TEXT,
  calendar_id TEXT DEFAULT 'primary',
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_integration_type UNIQUE (integration_type)
);

-- Enable Row Level Security
ALTER TABLE admin_integrations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage integrations
CREATE POLICY "Admin can manage integrations" ON admin_integrations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create updated_at trigger
CREATE TRIGGER update_admin_integrations_updated_at
  BEFORE UPDATE ON admin_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add Google Calendar sync columns to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS google_event_id TEXT,
  ADD COLUMN IF NOT EXISTS google_sync_status TEXT DEFAULT 'pending'
    CHECK (google_sync_status IN ('pending', 'synced', 'failed', 'not_applicable')),
  ADD COLUMN IF NOT EXISTS google_sync_error TEXT;

-- Create index for finding bookings that need syncing
CREATE INDEX IF NOT EXISTS idx_bookings_google_sync_status
  ON bookings(google_sync_status)
  WHERE google_sync_status IN ('pending', 'failed');

-- Grant access to authenticated users (RLS will handle the rest)
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_integrations TO authenticated;
