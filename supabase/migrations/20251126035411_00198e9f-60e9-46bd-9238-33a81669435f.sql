-- Fix Security Error #1: Customer Email Addresses Exposed to Unauthorized Users
-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view their own profile or owners/admins can view all" ON public.profiles;

-- Create stricter policies that prevent user enumeration
CREATE POLICY "Users can view only their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Owners and admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_owner_or_admin(auth.uid()));

-- Fix Security Error #2: Business Logic and Access Control Rules Publicly Visible
-- Drop the public policy on model_permissions
DROP POLICY IF EXISTS "Anyone can view model permissions" ON public.model_permissions;

-- Create policy that restricts access to authenticated users only
CREATE POLICY "Authenticated users can view model permissions" 
ON public.model_permissions 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Fix Security Warning #3: Usage Logs Could Be Modified or Deleted by Attackers
-- Add explicit policies to prevent tampering with audit logs
CREATE POLICY "Nobody can update usage logs" 
ON public.usage_logs 
FOR UPDATE 
USING (false);

CREATE POLICY "Nobody can delete usage logs" 
ON public.usage_logs 
FOR DELETE 
USING (false);