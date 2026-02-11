
-- Fix 1: Restrict app_settings public read to authenticated users only
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;

CREATE POLICY "Authenticated users can read app settings"
ON public.app_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix 2: Replace overly permissive rate_limits policy with restrictive ones
DROP POLICY IF EXISTS "System manages rate limits" ON public.rate_limits;

-- Only allow the security definer functions to manage rate limits (no direct user access)
-- Users should never directly read/write rate_limits; only the check_rate_limit and record_rate_limit functions do
CREATE POLICY "No direct user access to rate limits"
ON public.rate_limits
FOR ALL
USING (false)
WITH CHECK (false);
