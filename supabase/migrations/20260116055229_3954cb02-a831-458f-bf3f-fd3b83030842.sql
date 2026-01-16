-- Add new roles to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'education_admin';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'learning_department';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'learning_manager';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'sr_moderator';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'sr_admin';