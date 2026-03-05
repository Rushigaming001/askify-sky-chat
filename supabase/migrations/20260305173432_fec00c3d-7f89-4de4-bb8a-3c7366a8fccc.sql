
-- Create user_coins table for tracking coin balances
CREATE TABLE public.user_coins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 0,
  unlimited boolean NOT NULL DEFAULT false,
  last_daily_claim timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create coin_transactions table for tracking all coin movements
CREATE TABLE public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid,
  to_user_id uuid NOT NULL,
  amount integer NOT NULL,
  transaction_type text NOT NULL DEFAULT 'transfer',
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create message_reactions table
CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  message_type text NOT NULL DEFAULT 'public',
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.user_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- user_coins RLS policies
CREATE POLICY "Users can view all coin balances" ON public.user_coins FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert their own coin record" ON public.user_coins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own coins" ON public.user_coins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners can manage all coins" ON public.user_coins FOR ALL USING (public.is_owner(auth.uid())) WITH CHECK (public.is_owner(auth.uid()));

-- coin_transactions RLS policies
CREATE POLICY "Users can view their own transactions" ON public.coin_transactions FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Owners can view all transactions" ON public.coin_transactions FOR SELECT USING (public.is_owner(auth.uid()));
CREATE POLICY "Authenticated users can create transactions" ON public.coin_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- message_reactions RLS policies
CREATE POLICY "Anyone can view reactions" ON public.message_reactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can add reactions" ON public.message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own reactions" ON public.message_reactions FOR DELETE USING (auth.uid() = user_id);

-- Create function to transfer coins safely
CREATE OR REPLACE FUNCTION public.transfer_coins(_from_user_id uuid, _to_user_id uuid, _amount integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_balance integer;
  sender_unlimited boolean;
BEGIN
  IF _amount <= 0 THEN RETURN false; END IF;
  IF _from_user_id = _to_user_id THEN RETURN false; END IF;

  -- Check sender balance
  SELECT balance, unlimited INTO sender_balance, sender_unlimited
  FROM public.user_coins WHERE user_id = _from_user_id FOR UPDATE;

  IF NOT FOUND THEN RETURN false; END IF;
  IF NOT sender_unlimited AND sender_balance < _amount THEN RETURN false; END IF;

  -- Deduct from sender (skip if unlimited)
  IF NOT sender_unlimited THEN
    UPDATE public.user_coins SET balance = balance - _amount, updated_at = now() WHERE user_id = _from_user_id;
  END IF;

  -- Add to receiver (create record if not exists)
  INSERT INTO public.user_coins (user_id, balance) VALUES (_to_user_id, _amount)
  ON CONFLICT (user_id) DO UPDATE SET balance = user_coins.balance + _amount, updated_at = now();

  -- Log transaction
  INSERT INTO public.coin_transactions (from_user_id, to_user_id, amount, transaction_type, description)
  VALUES (_from_user_id, _to_user_id, _amount, 'transfer', 'Coin transfer');

  RETURN true;
END;
$$;

-- Create function to claim daily coins
CREATE OR REPLACE FUNCTION public.claim_daily_coins(_user_id uuid, _amount integer DEFAULT 10)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_claim timestamp with time zone;
BEGIN
  SELECT last_daily_claim INTO last_claim FROM public.user_coins WHERE user_id = _user_id;

  -- Create record if not exists
  IF NOT FOUND THEN
    INSERT INTO public.user_coins (user_id, balance, last_daily_claim)
    VALUES (_user_id, _amount, now());
    INSERT INTO public.coin_transactions (to_user_id, amount, transaction_type, description)
    VALUES (_user_id, _amount, 'daily', 'Daily coin claim');
    RETURN true;
  END IF;

  -- Check if already claimed today
  IF last_claim IS NOT NULL AND last_claim::date = now()::date THEN
    RETURN false;
  END IF;

  UPDATE public.user_coins SET balance = balance + _amount, last_daily_claim = now(), updated_at = now()
  WHERE user_id = _user_id;

  INSERT INTO public.coin_transactions (to_user_id, amount, transaction_type, description)
  VALUES (_user_id, _amount, 'daily', 'Daily coin claim');

  RETURN true;
END;
$$;

-- Create function for owner to give coins
CREATE OR REPLACE FUNCTION public.admin_give_coins(_admin_user_id uuid, _to_user_id uuid, _amount integer, _set_unlimited boolean DEFAULT false)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_owner(_admin_user_id) THEN RETURN false; END IF;

  INSERT INTO public.user_coins (user_id, balance, unlimited)
  VALUES (_to_user_id, _amount, _set_unlimited)
  ON CONFLICT (user_id) DO UPDATE SET
    balance = CASE WHEN _amount > 0 THEN user_coins.balance + _amount ELSE user_coins.balance END,
    unlimited = _set_unlimited,
    updated_at = now();

  INSERT INTO public.coin_transactions (from_user_id, to_user_id, amount, transaction_type, description)
  VALUES (_admin_user_id, _to_user_id, _amount, 'admin_grant', 'Admin coin grant');

  RETURN true;
END;
$$;

-- Fix stories bucket RLS - add storage policies for stories bucket
CREATE POLICY "Users can upload stories" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'stories' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can view stories" ON storage.objects FOR SELECT USING (bucket_id = 'stories');
CREATE POLICY "Users can delete own stories" ON storage.objects FOR DELETE USING (bucket_id = 'stories' AND auth.uid() IS NOT NULL);
