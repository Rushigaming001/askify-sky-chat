-- Add bio/description field to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image', -- 'image' or 'video'
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  view_count INTEGER NOT NULL DEFAULT 0
);

-- Create story views table to track who has seen a story
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Create snaps table for Snapchat-style messages
CREATE TABLE public.snaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image', -- 'image' or 'video'
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  viewed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Create chat_files table for large file uploads
CREATE TABLE public.chat_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  chat_type TEXT NOT NULL, -- 'public', 'friends', 'dm', 'group'
  chat_id TEXT, -- For DM or group reference
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_files ENABLE ROW LEVEL SECURITY;

-- Stories policies
CREATE POLICY "Anyone can view unexpired stories" ON public.stories
  FOR SELECT USING (expires_at > now());

CREATE POLICY "Users can create their own stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" ON public.stories
  FOR DELETE USING (auth.uid() = user_id);

-- Story views policies
CREATE POLICY "Story owners can view who saw their story" ON public.story_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM stories WHERE stories.id = story_id AND stories.user_id = auth.uid())
    OR viewer_id = auth.uid()
  );

CREATE POLICY "Users can mark stories as viewed" ON public.story_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Snaps policies
CREATE POLICY "Snap participants can view snaps" ON public.snaps
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send snaps" ON public.snaps
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can update snap view status" ON public.snaps
  FOR UPDATE USING (auth.uid() = receiver_id);

CREATE POLICY "Senders can delete their snaps" ON public.snaps
  FOR DELETE USING (auth.uid() = sender_id);

-- Chat files policies
CREATE POLICY "Anyone can view chat files" ON public.chat_files
  FOR SELECT USING (true);

CREATE POLICY "Users can upload files" ON public.chat_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files" ON public.chat_files
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for stories and snaps
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.snaps;

-- Create a bucket for large files (200MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('chat-files', 'chat-files', true, 209715200)
ON CONFLICT (id) DO UPDATE SET file_size_limit = 209715200;

-- Create a bucket for stories
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('stories', 'stories', true, 15728640)
ON CONFLICT (id) DO UPDATE SET file_size_limit = 15728640;

-- Storage policies for chat-files bucket
CREATE POLICY "Anyone can view chat files" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-files');

CREATE POLICY "Authenticated users can upload chat files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own chat files" ON storage.objects
  FOR DELETE USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for stories bucket
CREATE POLICY "Anyone can view stories files" ON storage.objects
  FOR SELECT USING (bucket_id = 'stories');

CREATE POLICY "Authenticated users can upload stories" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'stories' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own stories files" ON storage.objects
  FOR DELETE USING (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);