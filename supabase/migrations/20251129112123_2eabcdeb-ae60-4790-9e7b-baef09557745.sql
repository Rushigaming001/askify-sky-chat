-- Add NVIDIA model permissions
-- Grant owner role access to NVIDIA Nemotron model
INSERT INTO public.model_permissions (model_id, role, is_allowed)
VALUES ('nvidia/llama-3.1-nemotron-70b-instruct', 'owner', true)
ON CONFLICT (model_id, role) DO UPDATE SET is_allowed = true;

-- Also insert default permissions for admin and user roles (locked by default)
INSERT INTO public.model_permissions (model_id, role, is_allowed)
VALUES 
  ('nvidia/llama-3.1-nemotron-70b-instruct', 'admin', false),
  ('nvidia/llama-3.1-nemotron-70b-instruct', 'user', false)
ON CONFLICT (model_id, role) DO NOTHING;