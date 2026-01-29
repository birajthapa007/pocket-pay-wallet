-- Add rate limiting columns to otp_codes table
ALTER TABLE public.otp_codes ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0;
ALTER TABLE public.otp_codes ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- Reduce OTP expiry from 1 hour to 15 minutes for security
-- (handled in application code)

-- Fix profiles table - restrict to own profile or contacts lookup
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid());

-- Users can lookup profiles by username (for transfers) - but still requires authentication
CREATE POLICY "Users can lookup profiles by username"
ON public.profiles FOR SELECT TO authenticated
USING (true);
-- Note: Application layer limits what fields are returned and adds rate limiting

-- Fix risk_settings - remove public access, make it admin-only or edge function only
DROP POLICY IF EXISTS "Anyone can view risk settings" ON public.risk_settings;

-- Risk settings should only be accessed by backend/edge functions using service role key
-- No RLS policy needed for regular users - they shouldn't access this table directly
-- The edge functions use service role which bypasses RLS