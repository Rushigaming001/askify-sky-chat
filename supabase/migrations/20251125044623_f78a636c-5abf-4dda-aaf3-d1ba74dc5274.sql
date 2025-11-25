-- Create public_messages table for public chat
CREATE TABLE public.public_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.public_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public_messages
CREATE POLICY "Anyone can view public messages" 
ON public.public_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert messages" 
ON public.public_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" 
ON public.public_messages 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" 
ON public.public_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_public_messages_updated_at
BEFORE UPDATE ON public.public_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for public messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.public_messages;