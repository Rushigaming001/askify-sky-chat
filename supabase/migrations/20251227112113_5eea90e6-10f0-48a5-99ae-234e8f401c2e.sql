-- Bootstrap roles safely + allow users to create their own default role

-- 1) Security-definer helper: allow claiming the FIRST owner only if no owner exists yet
CREATE OR REPLACE FUNCTION public.can_claim_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'owner'::public.app_role
  );
$$;

-- 2) Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3) Allow any logged-in user to insert ONLY their own default 'user' role
DROP POLICY IF EXISTS "Users can insert their own default role" ON public.user_roles;
CREATE POLICY "Users can insert their own default role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = 'user'::public.app_role
);

-- 4) Allow the first-ever owner to be claimed (bootstrap), but only for self
DROP POLICY IF EXISTS "Users can claim initial owner role" ON public.user_roles;
CREATE POLICY "Users can claim initial owner role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = 'owner'::public.app_role
  AND public.can_claim_owner(auth.uid())
);

-- 5) Restore owner role for your account (if missing)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'owner'::public.app_role
FROM auth.users u
WHERE lower(u.email) = lower('yenurkarrajabhau@gmail.com')
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = u.id
      AND ur.role = 'owner'::public.app_role
  );
