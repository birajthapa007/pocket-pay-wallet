-- Create table to store custom OTP codes
CREATE TABLE public.otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT,
  code TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'login',
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_otp_codes_email ON public.otp_codes (email, code) WHERE verified_at IS NULL;
CREATE INDEX idx_otp_codes_expires ON public.otp_codes (expires_at) WHERE verified_at IS NULL;

-- Enable RLS (but allow edge functions to access via service role)
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- No public access - only edge functions with service role can access
-- This is intentional for security