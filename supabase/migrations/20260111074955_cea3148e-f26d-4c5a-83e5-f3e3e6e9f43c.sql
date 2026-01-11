-- Create table for AI chat history to sync across devices
CREATE TABLE public.ai_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  model TEXT NOT NULL DEFAULT 'grok',
  mode TEXT NOT NULL DEFAULT 'normal',
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for AI chat messages
CREATE TABLE public.ai_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.ai_chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS for ai_chats
CREATE POLICY "Users can view their own chats"
  ON public.ai_chats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chats"
  ON public.ai_chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chats"
  ON public.ai_chats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats"
  ON public.ai_chats FOR DELETE
  USING (auth.uid() = user_id);

-- RLS for ai_chat_messages  
CREATE POLICY "Users can view messages from their chats"
  ON public.ai_chat_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.ai_chats WHERE id = ai_chat_messages.chat_id AND user_id = auth.uid()));

CREATE POLICY "Users can insert messages to their chats"
  ON public.ai_chat_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_chats WHERE id = ai_chat_messages.chat_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete messages from their chats"
  ON public.ai_chat_messages FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.ai_chats WHERE id = ai_chat_messages.chat_id AND user_id = auth.uid()));

-- Create indexes
CREATE INDEX idx_ai_chats_user_id ON public.ai_chats(user_id);
CREATE INDEX idx_ai_chat_messages_chat_id ON public.ai_chat_messages(chat_id);
CREATE INDEX idx_ai_chats_updated_at ON public.ai_chats(updated_at DESC);

-- Trigger to update updated_at
CREATE OR REPLACE TRIGGER update_ai_chats_updated_at
BEFORE UPDATE ON public.ai_chats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();