-- Add image_url column to public_messages for image/gif support
ALTER TABLE public.public_messages 
ADD COLUMN IF NOT EXISTS image_url text;

-- Add image_url column to group_messages for image/gif support
ALTER TABLE public.group_messages 
ADD COLUMN IF NOT EXISTS image_url text;

-- Add image_url column to direct_messages for image/gif support
ALTER TABLE public.direct_messages 
ADD COLUMN IF NOT EXISTS image_url text;

-- Create friends_chat_messages table for Friends-only chat
CREATE TABLE IF NOT EXISTS public.friends_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  edited_at timestamp with time zone,
  deleted_at timestamp with time zone,
  deleted_by uuid REFERENCES public.profiles(id),
  edit_history jsonb DEFAULT '[]'::jsonb,
  reply_to uuid REFERENCES public.friends_chat_messages(id)
);

-- Enable RLS on friends_chat_messages
ALTER TABLE public.friends_chat_messages ENABLE ROW LEVEL SECURITY;

-- Only users with 'friend' role can view messages
CREATE POLICY "Friends can view friends chat messages" 
ON public.friends_chat_messages 
FOR SELECT 
USING (
  (deleted_at IS NULL AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'friend'
  ))
  OR is_owner_or_admin(auth.uid())
);

-- Only users with 'friend' role can insert messages
CREATE POLICY "Friends can send friends chat messages" 
ON public.friends_chat_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'friend'
  )
);

-- Users can update their own messages
CREATE POLICY "Users can update their own friends chat messages" 
ON public.friends_chat_messages 
FOR UPDATE 
USING (auth.uid() = user_id OR is_owner_or_admin(auth.uid()));

-- Users can delete their own messages or admins can delete any
CREATE POLICY "Users can delete their own friends chat messages" 
ON public.friends_chat_messages 
FOR DELETE 
USING (auth.uid() = user_id OR is_owner_or_admin(auth.uid()));

-- Enable realtime for friends_chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.friends_chat_messages;