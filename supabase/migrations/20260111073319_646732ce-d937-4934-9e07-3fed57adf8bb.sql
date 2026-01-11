-- Fix: Push Notification Credentials Publicly Readable
-- Drop the overly permissive SELECT policy that allows anyone to read credentials
DROP POLICY IF EXISTS "Service can read subscriptions for notification delivery" 
  ON public.push_subscriptions;

-- Create restrictive policy: Users can only read their own subscriptions
-- Edge functions use service role key to bypass RLS when needed
CREATE POLICY "Users can read own subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);