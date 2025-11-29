-- Create game rooms table
CREATE TABLE IF NOT EXISTS public.game_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting', -- waiting, playing, finished
  max_players integer NOT NULL DEFAULT 10,
  created_at timestamp with time zone DEFAULT now(),
  started_at timestamp with time zone,
  ended_at timestamp with time zone
);

-- Create room participants table
CREATE TABLE IF NOT EXISTS public.room_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  score integer DEFAULT 0,
  kills integer DEFAULT 0,
  deaths integer DEFAULT 0,
  is_alive boolean DEFAULT true,
  position_x real DEFAULT 0,
  position_y real DEFAULT 0,
  position_z real DEFAULT 0,
  rotation_y real DEFAULT 0,
  health integer DEFAULT 100,
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_rooms
CREATE POLICY "Anyone can view game rooms"
ON public.game_rooms FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create rooms"
ON public.game_rooms FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Room owners can update their rooms"
ON public.game_rooms FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Room owners can delete their rooms"
ON public.game_rooms FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- RLS Policies for room_participants
CREATE POLICY "Anyone can view room participants"
ON public.room_participants FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can join rooms"
ON public.room_participants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participant data"
ON public.room_participants FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
ON public.room_participants FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;