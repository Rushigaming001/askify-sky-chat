-- Fix: Only current drawer can update drawings (requires authentication)
DROP POLICY IF EXISTS "Anyone can update drawings" ON public.skribbl_drawings;

CREATE POLICY "Only current drawer can update drawings" 
  ON public.skribbl_drawings 
  FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM skribbl_rooms r
      JOIN skribbl_players p ON p.id = r.current_drawer_id
      WHERE r.id = skribbl_drawings.room_id
        AND p.user_id = auth.uid()
        AND r.status = 'playing'
    )
  );