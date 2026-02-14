
-- Create OTP verification table
CREATE TABLE public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  purpose text NOT NULL DEFAULT 'login', -- 'login' or 'register'
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- No direct client access - only edge functions should interact with this table
CREATE POLICY "No direct access to otp_codes" ON public.otp_codes
  FOR ALL USING (false) WITH CHECK (false);

-- Create index for efficient lookup
CREATE INDEX idx_otp_codes_email_purpose ON public.otp_codes (email, purpose, expires_at);

-- Auto-cleanup expired OTP codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.otp_codes WHERE expires_at < now();
END;
$$;
