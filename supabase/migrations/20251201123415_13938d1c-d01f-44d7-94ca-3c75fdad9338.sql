-- Create skribbl game rooms table
CREATE TABLE IF NOT EXISTS public.skribbl_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  host_id UUID NOT NULL,
  max_players INTEGER NOT NULL DEFAULT 8,
  current_round INTEGER NOT NULL DEFAULT 1,
  max_rounds INTEGER NOT NULL DEFAULT 3,
  round_time INTEGER NOT NULL DEFAULT 80,
  status TEXT NOT NULL DEFAULT 'waiting',
  current_word TEXT,
  current_drawer_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create skribbl players table
CREATE TABLE IF NOT EXISTS public.skribbl_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.skribbl_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  player_name TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  has_guessed BOOLEAN NOT NULL DEFAULT false,
  is_connected BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create skribbl drawings table
CREATE TABLE IF NOT EXISTS public.skribbl_drawings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.skribbl_rooms(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  drawing_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create skribbl guesses table
CREATE TABLE IF NOT EXISTS public.skribbl_guesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.skribbl_rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.skribbl_players(id) ON DELETE CASCADE,
  guess TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.skribbl_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skribbl_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skribbl_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skribbl_guesses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view skribbl rooms" ON public.skribbl_rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create skribbl rooms" ON public.skribbl_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update their skribbl room" ON public.skribbl_rooms FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Host can delete their skribbl room" ON public.skribbl_rooms FOR DELETE USING (auth.uid() = host_id);

CREATE POLICY "Anyone can view skribbl players" ON public.skribbl_players FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join as skribbl player" ON public.skribbl_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Players can update their own data" ON public.skribbl_players FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Players can delete themselves" ON public.skribbl_players FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view skribbl drawings" ON public.skribbl_drawings FOR SELECT USING (true);
CREATE POLICY "Players can create drawings" ON public.skribbl_drawings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update drawings" ON public.skribbl_drawings FOR UPDATE USING (true);

CREATE POLICY "Anyone can view guesses" ON public.skribbl_guesses FOR SELECT USING (true);
CREATE POLICY "Players can create guesses" ON public.skribbl_guesses FOR INSERT WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.skribbl_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.skribbl_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.skribbl_drawings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.skribbl_guesses;