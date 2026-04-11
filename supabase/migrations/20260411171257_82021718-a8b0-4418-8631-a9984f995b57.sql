
CREATE OR REPLACE FUNCTION public.get_skribbl_word_for_reveal(_room_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT current_word 
  FROM public.skribbl_rooms
  WHERE id = _room_id;
$$;
