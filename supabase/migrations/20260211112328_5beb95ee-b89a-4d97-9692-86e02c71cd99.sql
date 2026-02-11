
-- Fix 1: Skribbl drawings - restrict INSERT to current drawer only
DROP POLICY IF EXISTS "Players can create drawings" ON public.skribbl_drawings;
CREATE POLICY "Current drawer can create drawings" ON public.skribbl_drawings
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.skribbl_rooms r
      JOIN public.skribbl_players p ON p.room_id = r.id
      WHERE r.id = skribbl_drawings.room_id
        AND p.user_id = auth.uid()
        AND r.current_drawer_id = p.id
        AND r.status = 'playing'
    )
  );

-- Fix 1b: Skribbl drawings - restrict UPDATE to current drawer
DROP POLICY IF EXISTS "Only current drawer can update drawings" ON public.skribbl_drawings;
CREATE POLICY "Current drawer can update drawings" ON public.skribbl_drawings
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.skribbl_rooms r
      JOIN public.skribbl_players p ON p.id = r.current_drawer_id
      WHERE r.id = skribbl_drawings.room_id
        AND p.user_id = auth.uid()
        AND r.status = 'playing'
    )
  );

-- Fix 1c: Skribbl guesses - restrict INSERT to room participants who aren't the drawer
DROP POLICY IF EXISTS "Players can create guesses" ON public.skribbl_guesses;
CREATE POLICY "Room participants can create guesses" ON public.skribbl_guesses
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.skribbl_players p
      JOIN public.skribbl_rooms r ON r.id = p.room_id
      WHERE p.room_id = skribbl_guesses.room_id
        AND p.user_id = auth.uid()
        AND (r.current_drawer_id IS NULL OR r.current_drawer_id != p.id)
    )
  );

-- Fix 3: Make chat-files bucket private
UPDATE storage.buckets SET public = false WHERE id = 'chat-files';

-- Fix 3b: Drop overly permissive chat-files SELECT policy
DROP POLICY IF EXISTS "Anyone can view chat files" ON storage.objects;

-- Fix 3c: Add proper chat-files SELECT policy for authenticated users
CREATE POLICY "Authenticated users can view chat files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-files' AND auth.uid() IS NOT NULL
  );

-- Fix 3d: Drop overly permissive stories SELECT policy
DROP POLICY IF EXISTS "Anyone can view stories files" ON storage.objects;

-- Fix 3e: Add proper stories SELECT policy for authenticated users only
CREATE POLICY "Authenticated users can view stories files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'stories' AND auth.uid() IS NOT NULL
  );

-- Fix 4: Add input validation to user_has_restriction
CREATE OR REPLACE FUNCTION public.user_has_restriction(_user_id uuid, _restriction_type text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL OR _restriction_type IS NULL THEN
    RETURN false;
  END IF;
  
  IF _restriction_type NOT IN (
    'public_chat', 'direct_messages', 'groups', 'image_generation',
    'video_generation', 'math_solver', 'live_video_call',
    'minecraft_plugin', 'voice_chat', 'ai_chat',
    'ai_chat_disabled', 'image_generation_disabled',
    'video_generation_disabled', 'math_solver_disabled',
    'live_video_call_disabled', 'minecraft_plugin_disabled',
    'voice_chat_disabled'
  ) THEN
    RETURN false;
  END IF;

  RETURN COALESCE(
    (SELECT
      CASE _restriction_type
        WHEN 'public_chat' THEN banned_from_public_chat
        WHEN 'direct_messages' THEN banned_from_direct_messages
        WHEN 'groups' THEN banned_from_groups
        WHEN 'image_generation' THEN image_generation_disabled
        WHEN 'image_generation_disabled' THEN image_generation_disabled
        WHEN 'video_generation' THEN video_generation_disabled
        WHEN 'video_generation_disabled' THEN video_generation_disabled
        WHEN 'math_solver' THEN math_solver_disabled
        WHEN 'math_solver_disabled' THEN math_solver_disabled
        WHEN 'live_video_call' THEN live_video_call_disabled
        WHEN 'live_video_call_disabled' THEN live_video_call_disabled
        WHEN 'minecraft_plugin' THEN minecraft_plugin_disabled
        WHEN 'minecraft_plugin_disabled' THEN minecraft_plugin_disabled
        WHEN 'voice_chat' THEN voice_chat_disabled
        WHEN 'voice_chat_disabled' THEN voice_chat_disabled
        WHEN 'ai_chat' THEN ai_chat_disabled
        WHEN 'ai_chat_disabled' THEN ai_chat_disabled
      END
    FROM public.user_restrictions
    WHERE user_id = _user_id),
    false
  );
END;
$$;

-- Fix 4b: Add input validation to check_rate_limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(_user_id uuid, _action_type text, _max_count integer, _window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  window_start_time timestamp with time zone;
BEGIN
  IF _user_id IS NULL OR _action_type IS NULL OR _max_count IS NULL OR _window_seconds IS NULL THEN
    RETURN false;
  END IF;
  
  IF _max_count <= 0 OR _window_seconds <= 0 OR _window_seconds > 86400 THEN
    RETURN false;
  END IF;

  window_start_time := now() - (_window_seconds || ' seconds')::interval;
  
  SELECT COALESCE(SUM(action_count), 0) INTO current_count
  FROM public.rate_limits
  WHERE user_id = _user_id
    AND action_type = _action_type
    AND window_start >= window_start_time;
  
  RETURN current_count < _max_count;
END;
$$;

-- Fix 4c: Add input validation to record_rate_limit
CREATE OR REPLACE FUNCTION public.record_rate_limit(_user_id uuid, _action_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL OR _action_type IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.rate_limits (user_id, action_type, action_count, window_start)
  VALUES (_user_id, _action_type, 1, now())
  ON CONFLICT DO NOTHING;
END;
$$;
