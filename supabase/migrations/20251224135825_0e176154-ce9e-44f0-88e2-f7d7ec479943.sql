-- Fix: Require authentication for viewing profiles (protects email addresses)
DROP POLICY IF EXISTS "Users can view their own profile and profiles of public chat pa" ON profiles;

CREATE POLICY "Authenticated users can view public chat participant profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = id OR 
      EXISTS (SELECT 1 FROM public_messages WHERE public_messages.user_id = profiles.id)
    )
  );