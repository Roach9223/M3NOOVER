-- M3NOOVER Admin Setup
-- Run this ONE TIME after Chuck signs up with chuck@m3noover.com
--
-- Prerequisites:
-- 1. Chuck must first create an account at m3noover.app
-- 2. Run this in Supabase SQL Editor after signup

-- Update the profile to admin role
UPDATE public.profiles
SET role = 'admin', full_name = 'Coach Chuck'
WHERE id = (SELECT id FROM auth.users WHERE email = 'chuck@m3noover.com');

-- Verify the update
SELECT id, email, full_name, role FROM public.profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'chuck@m3noover.com');
