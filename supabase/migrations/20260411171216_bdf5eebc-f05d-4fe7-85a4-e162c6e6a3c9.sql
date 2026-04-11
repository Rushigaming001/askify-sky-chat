
CREATE OR REPLACE FUNCTION public.check_skribbl_guess(_room_id uuid, _guess text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(trim(_guess)) = lower(trim(current_word))
  FROM public.skribbl_rooms
  WHERE id = _room_id AND current_word IS NOT NULL;
$$;
