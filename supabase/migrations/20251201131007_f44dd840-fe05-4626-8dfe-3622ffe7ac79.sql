-- Create table for custom user message limits
CREATE TABLE IF NOT EXISTS public.user_message_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  daily_limit integer NOT NULL DEFAULT 20,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_message_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can view all message limits
CREATE POLICY "Owners can view all message limits"
ON public.user_message_limits
FOR SELECT
TO authenticated
USING (is_owner(auth.uid()));

-- Policy: Owners can insert message limits
CREATE POLICY "Owners can insert message limits"
ON public.user_message_limits
FOR INSERT
TO authenticated
WITH CHECK (is_owner(auth.uid()));

-- Policy: Owners can update message limits
CREATE POLICY "Owners can update message limits"
ON public.user_message_limits
FOR UPDATE
TO authenticated
USING (is_owner(auth.uid()));

-- Policy: Owners can delete message limits
CREATE POLICY "Owners can delete message limits"
ON public.user_message_limits
FOR DELETE
TO authenticated
USING (is_owner(auth.uid()));

-- Policy: Users can view their own message limit
CREATE POLICY "Users can view their own message limit"
ON public.user_message_limits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_message_limits_updated_at
BEFORE UPDATE ON public.user_message_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();