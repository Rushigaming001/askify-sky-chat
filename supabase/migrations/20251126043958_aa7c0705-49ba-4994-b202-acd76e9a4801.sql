-- Drop existing policies
DROP POLICY IF EXISTS "Users can view non-deleted messages" ON public.public_messages;
DROP POLICY IF EXISTS "Owners and admins can view all messages including deleted" ON public.public_messages;

-- Create policy for regular users to only see non-deleted messages
CREATE POLICY "Users can view non-deleted messages"
ON public.public_messages
FOR SELECT
USING (deleted_at IS NULL);

-- Owners and admins can view ALL messages including deleted ones
CREATE POLICY "Owners and admins can view all messages including deleted"
ON public.public_messages
FOR SELECT
USING (is_owner_or_admin(auth.uid()));