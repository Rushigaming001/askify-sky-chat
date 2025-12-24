-- Add timeout_until column to user_restrictions for temporary bans
ALTER TABLE public.user_restrictions 
ADD COLUMN IF NOT EXISTS public_chat_timeout_until TIMESTAMP WITH TIME ZONE;

-- Create function to check if user is timed out
CREATE OR REPLACE FUNCTION public.is_user_timed_out(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_restrictions
    WHERE user_id = _user_id
      AND public_chat_timeout_until IS NOT NULL
      AND public_chat_timeout_until > now()
  )
$$;