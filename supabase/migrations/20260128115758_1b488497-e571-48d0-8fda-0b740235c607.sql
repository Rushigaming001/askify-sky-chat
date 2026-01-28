-- Create app_settings table for maintenance mode and feature flags
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can read app settings" ON public.app_settings
FOR SELECT USING (true);

-- Only owners can modify settings  
CREATE POLICY "Owners can manage app settings" ON public.app_settings
FOR ALL USING (is_owner(auth.uid()));

-- Insert default maintenance settings
INSERT INTO public.app_settings (key, value) VALUES 
  ('maintenance_mode', '{"enabled": false, "message": "We are currently performing scheduled maintenance. Please check back soon.", "features": {}}'::jsonb),
  ('feature_flags', '{"public_chat": true, "ai_chat": true, "dm": true, "voice_calls": true, "video_calls": true, "image_generation": true, "video_generation": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create call_events table for tracking call history in DMs
CREATE TABLE IF NOT EXISTS public.call_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  call_type text NOT NULL CHECK (call_type IN ('voice', 'video')),
  status text NOT NULL CHECK (status IN ('initiated', 'answered', 'missed', 'declined', 'ended')),
  started_at timestamp with time zone DEFAULT now(),
  ended_at timestamp with time zone,
  duration_seconds integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on call_events
ALTER TABLE public.call_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own call events
CREATE POLICY "Users can view their own call events" ON public.call_events
FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Users can create call events they initiate
CREATE POLICY "Users can create call events" ON public.call_events
FOR INSERT WITH CHECK (auth.uid() = caller_id);

-- Users can update call events they're part of
CREATE POLICY "Users can update their call events" ON public.call_events
FOR UPDATE USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Add rate limiting table for security
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- System can manage rate limits
CREATE POLICY "System manages rate limits" ON public.rate_limits
FOR ALL USING (true);

-- Create unique constraint for user+action within window
CREATE INDEX idx_rate_limits_lookup ON public.rate_limits (user_id, action_type, window_start);

-- Function to check rate limit
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
  window_start_time := now() - (_window_seconds || ' seconds')::interval;
  
  -- Count actions in the current window
  SELECT COALESCE(SUM(action_count), 0) INTO current_count
  FROM public.rate_limits
  WHERE user_id = _user_id
    AND action_type = _action_type
    AND window_start >= window_start_time;
  
  RETURN current_count < _max_count;
END;
$$;

-- Function to record rate limit action
CREATE OR REPLACE FUNCTION public.record_rate_limit(_user_id uuid, _action_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.rate_limits (user_id, action_type, action_count, window_start)
  VALUES (_user_id, _action_type, 1, now())
  ON CONFLICT DO NOTHING;
END;
$$;

-- Clean up old rate limit records (can be called periodically)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 hour';
END;
$$;