-- Fix security issues: Restrict user_presence to authenticated users only
DROP POLICY IF EXISTS "Anyone can view user presence" ON public.user_presence;

CREATE POLICY "Authenticated users can view user presence"
ON public.user_presence
FOR SELECT
TO authenticated
USING (true);

-- Add explicit denial for unauthenticated access to groups
CREATE POLICY "Deny unauthenticated access to groups"
ON public.groups
FOR SELECT
TO anon
USING (false);

-- Add explicit denial for unauthenticated access to group_members
CREATE POLICY "Deny unauthenticated access to group_members"
ON public.group_members
FOR SELECT
TO anon
USING (false);

-- Add explicit denial for unauthenticated access to group_messages
CREATE POLICY "Deny unauthenticated access to group_messages"
ON public.group_messages
FOR SELECT
TO anon
USING (false);

-- Add explicit denial for unauthenticated access to direct_messages
CREATE POLICY "Deny unauthenticated access to direct_messages"
ON public.direct_messages
FOR SELECT
TO anon
USING (false);