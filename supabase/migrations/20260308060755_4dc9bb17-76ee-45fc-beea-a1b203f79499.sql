
-- Fix user_roles SELECT policies: drop all RESTRICTIVE ones, create one PERMISSIVE
DROP POLICY IF EXISTS "All authenticated users can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners and admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Single permissive policy: all authenticated users can view all roles
CREATE POLICY "Anyone authenticated can view roles"
ON public.user_roles FOR SELECT TO authenticated
USING (true);

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit feedback"
ON public.feedback FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can view all feedback"
ON public.feedback FOR SELECT TO authenticated
USING (public.is_owner(auth.uid()));

CREATE POLICY "Owners can delete feedback"
ON public.feedback FOR DELETE TO authenticated
USING (public.is_owner(auth.uid()));

-- Create reel_earnings table for tracking monetization
CREATE TABLE IF NOT EXISTS public.reel_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  views_milestone integer NOT NULL,
  coins_awarded integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(story_id, views_milestone)
);

ALTER TABLE public.reel_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own earnings"
ON public.reel_earnings FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert earnings"
ON public.reel_earnings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
