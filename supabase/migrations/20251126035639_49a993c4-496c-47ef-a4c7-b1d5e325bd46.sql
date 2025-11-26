-- Fix Public Chat profile visibility issue
-- Users need to see profiles of other users who post in public chat
-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view only their own profile" ON public.profiles;

-- Create a policy that allows viewing profiles in public chat context
CREATE POLICY "Users can view their own profile and profiles of public chat participants" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id 
  OR 
  -- Allow viewing profiles of users who have posted in public chat
  EXISTS (
    SELECT 1 FROM public.public_messages 
    WHERE public_messages.user_id = profiles.id
  )
);