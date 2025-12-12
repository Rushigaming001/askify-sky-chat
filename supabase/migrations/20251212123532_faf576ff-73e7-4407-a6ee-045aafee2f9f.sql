-- Add new roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ceo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'founder';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'co_founder';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'friend';