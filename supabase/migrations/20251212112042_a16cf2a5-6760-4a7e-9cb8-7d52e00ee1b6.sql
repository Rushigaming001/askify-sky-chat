-- Create a security definer function to check group membership without recursion
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE user_id = _user_id
      AND group_id = _group_id
  )
$$;

-- Create function to check if user is group admin
CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE user_id = _user_id
      AND group_id = _group_id
      AND role = 'admin'
  )
$$;

-- Create function to check if user created the group
CREATE OR REPLACE FUNCTION public.is_group_creator(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.groups
    WHERE id = _group_id
      AND created_by = _user_id
  )
$$;

-- Drop existing problematic policies on groups table
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
DROP POLICY IF EXISTS "Group creators and admins can update groups" ON public.groups;
DROP POLICY IF EXISTS "Group creators and admins can delete groups" ON public.groups;

-- Drop existing problematic policies on group_members table
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can add members" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can remove members" ON public.group_members;

-- Recreate policies using the security definer functions

-- Groups table policies
CREATE POLICY "Users can view groups they are members of"
ON public.groups
FOR SELECT
USING (is_group_member(auth.uid(), id) OR is_owner_or_admin(auth.uid()));

CREATE POLICY "Group creators and admins can update groups"
ON public.groups
FOR UPDATE
USING (created_by = auth.uid() OR is_group_admin(auth.uid(), id));

CREATE POLICY "Group creators and admins can delete groups"
ON public.groups
FOR DELETE
USING (created_by = auth.uid() OR is_group_admin(auth.uid(), id));

-- Group members table policies
CREATE POLICY "Users can view members of their groups"
ON public.group_members
FOR SELECT
USING (is_group_member(auth.uid(), group_id) OR is_owner_or_admin(auth.uid()));

CREATE POLICY "Group admins can add members"
ON public.group_members
FOR INSERT
WITH CHECK (is_group_admin(auth.uid(), group_id) OR is_group_creator(auth.uid(), group_id));

CREATE POLICY "Group admins can remove members"
ON public.group_members
FOR DELETE
USING (is_group_admin(auth.uid(), group_id) OR is_group_creator(auth.uid(), group_id) OR user_id = auth.uid());