-- Add missing model permissions for google/gemini-2.5-flash-lite
INSERT INTO model_permissions (model_id, role, is_allowed) VALUES
  ('google/gemini-2.5-flash-lite', 'user', true),
  ('google/gemini-2.5-flash-lite', 'admin', true),
  ('google/gemini-2.5-flash-lite', 'owner', true),
  ('google/gemini-2.5-flash-lite', 'moderator', true)
ON CONFLICT (model_id, role) DO NOTHING;