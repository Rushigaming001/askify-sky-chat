-- Add edit/delete tracking to public messages
ALTER TABLE public.public_messages 
ADD COLUMN edited_at timestamp with time zone,
ADD COLUMN deleted_at timestamp with time zone,
ADD COLUMN deleted_by uuid REFERENCES profiles(id),
ADD COLUMN edit_history jsonb DEFAULT '[]'::jsonb;

-- Add index for better query performance
CREATE INDEX idx_public_messages_deleted_at ON public.public_messages(deleted_at);

-- Update RLS policies to handle deleted messages
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view public messages" ON public.public_messages;

-- Regular users can only see non-deleted messages
CREATE POLICY "Users can view non-deleted messages" 
ON public.public_messages 
FOR SELECT 
USING (deleted_at IS NULL);

-- Owners and admins can see all messages including deleted
CREATE POLICY "Owners and admins can view all messages including deleted" 
ON public.public_messages 
FOR SELECT 
USING (is_owner_or_admin(auth.uid()));

-- Allow users to mark their own messages as deleted
CREATE POLICY "Users can soft delete their own messages" 
ON public.public_messages 
FOR UPDATE 
USING (auth.uid() = user_id AND deleted_at IS NULL)
WITH CHECK (
  auth.uid() = user_id 
  AND deleted_at IS NOT NULL 
  AND deleted_by = auth.uid()
);