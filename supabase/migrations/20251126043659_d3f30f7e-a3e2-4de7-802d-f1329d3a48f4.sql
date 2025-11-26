-- Drop the conflicting UPDATE policies
DROP POLICY IF EXISTS "Users can soft delete their own messages" ON public.public_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.public_messages;

-- Create a single comprehensive UPDATE policy for all updates (edit and soft delete)
CREATE POLICY "Users can update their own messages"
ON public.public_messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  (
    -- Allow regular edits (message not deleted)
    (deleted_at IS NULL) OR
    -- Allow soft delete (setting deleted_at and deleted_by)
    (deleted_at IS NOT NULL AND deleted_by = auth.uid())
  )
);