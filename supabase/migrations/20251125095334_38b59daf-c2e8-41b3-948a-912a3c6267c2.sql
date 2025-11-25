-- Create usage logs table to track model usage
CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  mode TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Owners and admins can view all logs
CREATE POLICY "Owners and admins can view all usage logs"
ON public.usage_logs
FOR SELECT
USING (is_owner_or_admin(auth.uid()));

-- Users can view their own logs
CREATE POLICY "Users can view their own usage logs"
ON public.usage_logs
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert logs (for edge function)
CREATE POLICY "Authenticated users can insert their own logs"
ON public.usage_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_model_id ON public.usage_logs(model_id);
CREATE INDEX idx_usage_logs_created_at ON public.usage_logs(created_at DESC);