-- Update your account to owner role
UPDATE public.user_roles
SET role = 'owner'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'yenurkarrajabhau@gmail.com');

-- Create function to check if user is owner or admin
CREATE OR REPLACE FUNCTION public.is_owner_or_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('owner', 'admin')
  )
$$;

-- Create function to check if user is owner
CREATE OR REPLACE FUNCTION public.is_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'owner'
  )
$$;

-- Update RLS policies to give owners full access
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Owners and admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_owner_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Owners and admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_owner_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Owners and admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_owner_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Owners and admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_owner_or_admin(auth.uid()));

-- Update profiles policies for owner access
DROP POLICY IF EXISTS "Users can view their own profile or admins can view all" ON public.profiles;
CREATE POLICY "Users can view their own profile or owners/admins can view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR public.is_owner_or_admin(auth.uid())
);

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Owners and admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_owner_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
CREATE POLICY "Owners and admins can delete any profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.is_owner_or_admin(auth.uid()));