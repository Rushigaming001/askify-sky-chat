
-- Paper generator settings (password, enabled status)
CREATE TABLE public.paper_generator_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  password_enabled boolean NOT NULL DEFAULT false,
  password_hash text DEFAULT '',
  whitelist_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.paper_generator_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read settings"
  ON public.paper_generator_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only owners can manage settings"
  ON public.paper_generator_settings FOR ALL
  USING (is_owner(auth.uid()))
  WITH CHECK (is_owner(auth.uid()));

-- Paper generator allowed users (whitelist)
CREATE TABLE public.paper_generator_allowed_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.paper_generator_allowed_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can check own access"
  ON public.paper_generator_allowed_users FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only owners can manage whitelist"
  ON public.paper_generator_allowed_users FOR ALL
  USING (is_owner(auth.uid()))
  WITH CHECK (is_owner(auth.uid()));

-- Paper generator activity log
CREATE TABLE public.paper_generator_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text,
  user_name text,
  paper_class text NOT NULL,
  subject text NOT NULL,
  generation_type text NOT NULL DEFAULT 'generate',
  total_marks text,
  difficulty text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.paper_generator_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view all activity"
  ON public.paper_generator_activity FOR SELECT
  USING (is_owner(auth.uid()));

CREATE POLICY "Authenticated users can log activity"
  ON public.paper_generator_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Insert default settings row
INSERT INTO public.paper_generator_settings (password_enabled, password_hash, whitelist_enabled) 
VALUES (false, '', false);

-- Trigger for updated_at
CREATE TRIGGER update_paper_generator_settings_updated_at
  BEFORE UPDATE ON public.paper_generator_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
