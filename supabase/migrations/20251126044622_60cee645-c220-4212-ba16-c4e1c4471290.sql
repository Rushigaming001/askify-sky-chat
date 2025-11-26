-- Create user_restrictions table for granular permission control
CREATE TABLE IF NOT EXISTS public.user_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_from_public_chat BOOLEAN DEFAULT false,
  banned_from_direct_messages BOOLEAN DEFAULT false,
  banned_from_groups BOOLEAN DEFAULT false,
  image_generation_disabled BOOLEAN DEFAULT false,
  video_generation_disabled BOOLEAN DEFAULT false,
  math_solver_disabled BOOLEAN DEFAULT false,
  live_video_call_disabled BOOLEAN DEFAULT false,
  minecraft_plugin_disabled BOOLEAN DEFAULT false,
  voice_chat_disabled BOOLEAN DEFAULT false,
  ai_chat_disabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_restrictions ENABLE ROW LEVEL SECURITY;

-- Only owners can view and manage restrictions
CREATE POLICY "Owners can view all restrictions"
  ON public.user_restrictions
  FOR SELECT
  USING (is_owner(auth.uid()));

CREATE POLICY "Owners can insert restrictions"
  ON public.user_restrictions
  FOR INSERT
  WITH CHECK (is_owner(auth.uid()));

CREATE POLICY "Owners can update restrictions"
  ON public.user_restrictions
  FOR UPDATE
  USING (is_owner(auth.uid()));

CREATE POLICY "Owners can delete restrictions"
  ON public.user_restrictions
  FOR DELETE
  USING (is_owner(auth.uid()));

-- Users can view their own restrictions
CREATE POLICY "Users can view their own restrictions"
  ON public.user_restrictions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_user_restrictions_updated_at
  BEFORE UPDATE ON public.user_restrictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user has any restriction
CREATE OR REPLACE FUNCTION public.user_has_restriction(
  _user_id UUID,
  _restriction_type TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    CASE _restriction_type
      WHEN 'public_chat' THEN banned_from_public_chat
      WHEN 'direct_messages' THEN banned_from_direct_messages
      WHEN 'groups' THEN banned_from_groups
      WHEN 'image_generation' THEN image_generation_disabled
      WHEN 'video_generation' THEN video_generation_disabled
      WHEN 'math_solver' THEN math_solver_disabled
      WHEN 'live_video_call' THEN live_video_call_disabled
      WHEN 'minecraft_plugin' THEN minecraft_plugin_disabled
      WHEN 'voice_chat' THEN voice_chat_disabled
      WHEN 'ai_chat' THEN ai_chat_disabled
    END,
    false
  )
  FROM public.user_restrictions
  WHERE user_id = _user_id
$$;