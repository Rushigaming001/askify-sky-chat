-- Create a table for role permissions (what each role can do)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission_name TEXT NOT NULL,
  is_allowed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, permission_name)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Only owner can read and modify role permissions
CREATE POLICY "Owners can manage role permissions"
  ON public.role_permissions
  FOR ALL
  USING (public.is_owner(auth.uid()))
  WITH CHECK (public.is_owner(auth.uid()));

-- Allow admins to read role permissions
CREATE POLICY "Admins can view role permissions"
  ON public.role_permissions
  FOR SELECT
  USING (public.is_owner_or_admin(auth.uid()));

-- Insert default permissions for new roles
INSERT INTO public.role_permissions (role, permission_name, is_allowed) VALUES
  -- CEO permissions (nearly full access)
  ('ceo', 'public_chat', true),
  ('ceo', 'direct_messages', true),
  ('ceo', 'groups', true),
  ('ceo', 'ai_chat', true),
  ('ceo', 'image_generation', true),
  ('ceo', 'video_generation', true),
  ('ceo', 'math_solver', true),
  ('ceo', 'live_video_call', true),
  ('ceo', 'minecraft_plugin', true),
  ('ceo', 'voice_chat', true),
  
  -- Founder permissions
  ('founder', 'public_chat', true),
  ('founder', 'direct_messages', true),
  ('founder', 'groups', true),
  ('founder', 'ai_chat', true),
  ('founder', 'image_generation', true),
  ('founder', 'video_generation', true),
  ('founder', 'math_solver', true),
  ('founder', 'live_video_call', true),
  ('founder', 'minecraft_plugin', true),
  ('founder', 'voice_chat', true),
  
  -- Co-Founder permissions
  ('co_founder', 'public_chat', true),
  ('co_founder', 'direct_messages', true),
  ('co_founder', 'groups', true),
  ('co_founder', 'ai_chat', true),
  ('co_founder', 'image_generation', true),
  ('co_founder', 'video_generation', true),
  ('co_founder', 'math_solver', true),
  ('co_founder', 'live_video_call', true),
  ('co_founder', 'minecraft_plugin', true),
  ('co_founder', 'voice_chat', true),
  
  -- Friend permissions (basic access)
  ('friend', 'public_chat', true),
  ('friend', 'direct_messages', true),
  ('friend', 'groups', true),
  ('friend', 'ai_chat', true),
  ('friend', 'image_generation', false),
  ('friend', 'video_generation', false),
  ('friend', 'math_solver', true),
  ('friend', 'live_video_call', false),
  ('friend', 'minecraft_plugin', false),
  ('friend', 'voice_chat', true),
  
  -- Moderator permissions
  ('moderator', 'public_chat', true),
  ('moderator', 'direct_messages', true),
  ('moderator', 'groups', true),
  ('moderator', 'ai_chat', true),
  ('moderator', 'image_generation', true),
  ('moderator', 'video_generation', true),
  ('moderator', 'math_solver', true),
  ('moderator', 'live_video_call', true),
  ('moderator', 'minecraft_plugin', true),
  ('moderator', 'voice_chat', true)
ON CONFLICT (role, permission_name) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();