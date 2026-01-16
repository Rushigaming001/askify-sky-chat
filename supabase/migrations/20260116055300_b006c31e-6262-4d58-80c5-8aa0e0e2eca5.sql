-- Create role_abilities table to control what each role can do
CREATE TABLE IF NOT EXISTS public.role_abilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role app_role NOT NULL,
  ability_name TEXT NOT NULL,
  is_allowed BOOLEAN NOT NULL DEFAULT false,
  max_target_role app_role DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role, ability_name)
);

-- Enable RLS
ALTER TABLE public.role_abilities ENABLE ROW LEVEL SECURITY;

-- Only owners can manage role abilities
CREATE POLICY "Owners can view role abilities"
ON public.role_abilities FOR SELECT
USING (is_owner(auth.uid()));

CREATE POLICY "Owners can insert role abilities"
ON public.role_abilities FOR INSERT
WITH CHECK (is_owner(auth.uid()));

CREATE POLICY "Owners can update role abilities"
ON public.role_abilities FOR UPDATE
USING (is_owner(auth.uid()));

CREATE POLICY "Owners can delete role abilities"
ON public.role_abilities FOR DELETE
USING (is_owner(auth.uid()));

-- Insert default abilities for all existing roles first
INSERT INTO public.role_abilities (role, ability_name, is_allowed, max_target_role)
SELECT role::app_role, ability, false, NULL
FROM (
  VALUES 
    ('owner'), ('ceo'), ('founder'), ('co_founder'), ('admin'), 
    ('moderator'), ('friend'), ('user'), ('plus'), ('pro'), ('elite'),
    ('silver'), ('gold'), ('platinum'), ('basic'), ('premium'), ('vip'),
    ('sr_admin'), ('sr_moderator'), ('education_admin'), ('learning_department'), ('learning_manager')
) AS roles(role)
CROSS JOIN (
  VALUES 
    ('assign_roles'),
    ('ban_from_app'),
    ('temp_ban_from_app'),
    ('ban_from_public_chat'),
    ('ban_from_groups'),
    ('ban_from_dms'),
    ('delete_messages'),
    ('timeout_users'),
    ('view_user_data'),
    ('edit_user_profiles'),
    ('manage_permissions')
) AS abilities(ability)
ON CONFLICT (role, ability_name) DO NOTHING;

-- Set owner abilities to true by default
UPDATE public.role_abilities
SET is_allowed = true
WHERE role = 'owner';

-- Set some default abilities for admins
UPDATE public.role_abilities
SET is_allowed = true, max_target_role = 'moderator'
WHERE role = 'admin' AND ability_name IN ('assign_roles', 'ban_from_public_chat', 'ban_from_groups', 'delete_messages', 'timeout_users');

-- Set some default abilities for sr_admin
UPDATE public.role_abilities
SET is_allowed = true, max_target_role = 'admin'
WHERE role = 'sr_admin' AND ability_name IN ('assign_roles', 'ban_from_public_chat', 'ban_from_groups', 'ban_from_dms', 'delete_messages', 'timeout_users', 'view_user_data');

-- Set some default abilities for moderators
UPDATE public.role_abilities
SET is_allowed = true, max_target_role = 'user'
WHERE role = 'moderator' AND ability_name IN ('delete_messages', 'timeout_users');

-- Set some default abilities for sr_moderator
UPDATE public.role_abilities
SET is_allowed = true, max_target_role = 'moderator'
WHERE role = 'sr_moderator' AND ability_name IN ('assign_roles', 'delete_messages', 'timeout_users', 'ban_from_public_chat');