-- Create table for model access control
CREATE TABLE IF NOT EXISTS public.model_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id text NOT NULL,
  role app_role NOT NULL,
  is_allowed boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(model_id, role)
);

-- Enable RLS
ALTER TABLE public.model_permissions ENABLE ROW LEVEL SECURITY;

-- Owners can manage all model permissions
CREATE POLICY "Owners can manage model permissions"
ON public.model_permissions
FOR ALL
TO authenticated
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));

-- Everyone can view model permissions
CREATE POLICY "Anyone can view model permissions"
ON public.model_permissions
FOR SELECT
TO authenticated
USING (true);

-- Insert default permissions (premium models locked for regular users)
INSERT INTO public.model_permissions (model_id, role, is_allowed) VALUES
  ('google/gemini-2.5-flash', 'user', true),
  ('google/gemini-2.5-flash', 'admin', true),
  ('google/gemini-2.5-flash', 'owner', true),
  ('openai/gpt-5', 'user', false),
  ('openai/gpt-5', 'admin', true),
  ('openai/gpt-5', 'owner', true),
  ('openai/gpt-5-mini', 'user', false),
  ('openai/gpt-5-mini', 'admin', true),
  ('openai/gpt-5-mini', 'owner', true),
  ('openai/gpt-5-nano', 'user', true),
  ('openai/gpt-5-nano', 'admin', true),
  ('openai/gpt-5-nano', 'owner', true),
  ('google/gemini-3-pro-preview', 'user', false),
  ('google/gemini-3-pro-preview', 'admin', true),
  ('google/gemini-3-pro-preview', 'owner', true),
  ('google/gemini-2.5-pro', 'user', true),
  ('google/gemini-2.5-pro', 'admin', true),
  ('google/gemini-2.5-pro', 'owner', true)
ON CONFLICT (model_id, role) DO NOTHING;

-- Create function to check if user can access a model
CREATE OR REPLACE FUNCTION public.can_access_model(_user_id uuid, _model_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT mp.is_allowed
      FROM public.model_permissions mp
      JOIN public.user_roles ur ON ur.role = mp.role
      WHERE ur.user_id = _user_id
        AND mp.model_id = _model_id
      ORDER BY 
        CASE ur.role
          WHEN 'owner' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'user' THEN 3
        END
      LIMIT 1
    ),
    false
  )
$$;