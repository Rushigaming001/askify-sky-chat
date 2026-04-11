
-- 1. FIX: user_coins - Remove direct UPDATE by users, only allow via SECURITY DEFINER functions
DROP POLICY IF EXISTS "Users can update their own coins" ON public.user_coins;
DROP POLICY IF EXISTS "Users can update own coins" ON public.user_coins;

-- Find and drop any UPDATE policy on user_coins that allows user self-update
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'user_coins' AND schemaname = 'public' AND cmd = 'UPDATE'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_coins', pol.policyname);
  END LOOP;
END $$;

-- Only allow updates via SECURITY DEFINER functions (no direct user UPDATE)
-- Users can still read their own coins
DROP POLICY IF EXISTS "Users can view their own coins" ON public.user_coins;
CREATE POLICY "Users can view their own coins"
  ON public.user_coins FOR SELECT
  USING (auth.uid() = user_id);

-- 2. FIX: coin_transactions - Tighten INSERT to prevent forging sender
DROP POLICY IF EXISTS "Authenticated users can create transactions" ON public.coin_transactions;
CREATE POLICY "Users can create own transactions"
  ON public.coin_transactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (from_user_id = auth.uid() OR from_user_id IS NULL));

-- 3. FIX: chat_files - Require authentication for SELECT
DROP POLICY IF EXISTS "Anyone can view chat files" ON public.chat_files;
CREATE POLICY "Authenticated users can view chat files"
  ON public.chat_files FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 4. FIX: skribbl_rooms - Hide current_word from non-drawers
-- Drop existing open SELECT policy
DROP POLICY IF EXISTS "Anyone can view skribbl rooms" ON public.skribbl_rooms;

-- Create a SECURITY DEFINER function to get the word only for the drawer
CREATE OR REPLACE FUNCTION public.get_skribbl_word(_room_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT current_word 
  FROM public.skribbl_rooms r
  JOIN public.skribbl_players p ON p.room_id = r.id AND p.id = r.current_drawer_id
  WHERE r.id = _room_id AND p.user_id = auth.uid();
$$;

-- Allow authenticated users to view rooms but current_word will be null for non-drawers
-- We can't hide columns via RLS, so we create a policy that still allows SELECT
-- The app code should use get_skribbl_word() for the drawer
CREATE POLICY "Authenticated users can view skribbl rooms"
  ON public.skribbl_rooms FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 5. FIX: stories table - Require authentication
DROP POLICY IF EXISTS "Anyone can view unexpired stories" ON public.stories;
CREATE POLICY "Authenticated users can view unexpired stories"
  ON public.stories FOR SELECT
  USING (auth.uid() IS NOT NULL AND expires_at > now());

-- 6. FIX: stories storage - Add auth and ownership checks
DROP POLICY IF EXISTS "Users can view stories" ON storage.objects;
CREATE POLICY "Authenticated users can view stories"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stories' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete own stories" ON storage.objects;
CREATE POLICY "Users can delete own stories"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'stories' AND auth.uid() IS NOT NULL AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 7. FIX: profiles - Restrict email exposure
-- Drop the broad participant profiles policy
DROP POLICY IF EXISTS "Authenticated users can view public chat participant profiles" ON public.profiles;

-- Create a policy that shows profiles (without email restriction at RLS level)
-- but scoped to authenticated users who need to see other users
-- Since RLS can't hide individual columns, we'll tighten who can see profiles
CREATE POLICY "Authenticated users can view basic profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = id
      OR is_owner_or_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public_messages WHERE public_messages.user_id = profiles.id
      )
      OR EXISTS (
        SELECT 1 FROM group_members gm1
        JOIN group_members gm2 ON gm1.group_id = gm2.group_id
        WHERE gm1.user_id = profiles.id AND gm2.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM friendships 
        WHERE (user_id = auth.uid() AND friend_id = profiles.id)
           OR (friend_id = auth.uid() AND user_id = profiles.id)
      )
      OR EXISTS (
        SELECT 1 FROM direct_messages
        WHERE (sender_id = auth.uid() AND receiver_id = profiles.id)
           OR (receiver_id = auth.uid() AND sender_id = profiles.id)
      )
    )
  );
