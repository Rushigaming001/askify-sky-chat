-- Update NVIDIA model to use Llama 3.1 8B instead of Nemotron 70B
-- First, update existing permissions
UPDATE public.model_permissions 
SET model_id = 'meta/llama-3.1-8b-instruct'
WHERE model_id = 'nvidia/llama-3.1-nemotron-70b-instruct';

-- If no permissions existed, insert new ones
INSERT INTO public.model_permissions (model_id, role, is_allowed)
VALUES 
  ('meta/llama-3.1-8b-instruct', 'owner', true),
  ('meta/llama-3.1-8b-instruct', 'admin', false),
  ('meta/llama-3.1-8b-instruct', 'user', false)
ON CONFLICT (model_id, role) DO UPDATE SET is_allowed = EXCLUDED.is_allowed;