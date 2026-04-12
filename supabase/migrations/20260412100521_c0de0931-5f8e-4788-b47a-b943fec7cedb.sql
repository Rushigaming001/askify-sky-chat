-- Create paper_updates table for owner-only broadcast channel
CREATE TABLE public.paper_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.paper_updates ENABLE ROW LEVEL SECURITY;

-- Only owner can create updates
CREATE POLICY "Only owners can create paper updates"
ON public.paper_updates FOR INSERT
WITH CHECK (is_owner(auth.uid()));

-- Only owner can update
CREATE POLICY "Only owners can edit paper updates"
ON public.paper_updates FOR UPDATE
USING (is_owner(auth.uid()));

-- Only owner can delete
CREATE POLICY "Only owners can delete paper updates"
ON public.paper_updates FOR DELETE
USING (is_owner(auth.uid()));

-- All authenticated users can view
CREATE POLICY "Authenticated users can view paper updates"
ON public.paper_updates FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.paper_updates;

-- Ensure paper_generator_settings has at least one row with password required
INSERT INTO public.paper_generator_settings (password_enabled, password_hash, whitelist_enabled)
SELECT true, '', false
WHERE NOT EXISTS (SELECT 1 FROM public.paper_generator_settings);