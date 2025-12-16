-- Add reply_to column to public_messages for reply functionality
ALTER TABLE public.public_messages 
ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES public.public_messages(id) ON DELETE SET NULL;