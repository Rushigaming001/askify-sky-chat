-- Add 9 new paid roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'plus';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pro';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'elite';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'silver';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gold';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'platinum';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'basic';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'premium';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vip';