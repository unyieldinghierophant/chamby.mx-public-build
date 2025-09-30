-- Create table for OTP storage with rate limiting
CREATE TABLE IF NOT EXISTS public.phone_verification_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  otp_hash text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '5 minutes'),
  verified boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.phone_verification_otps ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own OTP records
CREATE POLICY "Users can access their own OTP records"
ON public.phone_verification_otps
FOR ALL
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_phone_verification_phone ON public.phone_verification_otps(phone_number);
CREATE INDEX idx_phone_verification_expires ON public.phone_verification_otps(expires_at);

-- Add phone_verified column to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false;

-- Create function to check rate limiting (max 3 OTP sends per hour per phone)
CREATE OR REPLACE FUNCTION public.check_otp_rate_limit(phone text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) < 3
  FROM phone_verification_otps
  WHERE phone_number = phone
    AND created_at > now() - interval '1 hour';
$$;

-- Create function to clean up expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM phone_verification_otps
  WHERE expires_at < now()
    OR (verified = true AND created_at < now() - interval '1 day');
$$;