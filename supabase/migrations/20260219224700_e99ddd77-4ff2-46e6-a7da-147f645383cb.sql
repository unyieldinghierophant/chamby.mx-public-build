
-- Create user_credits table for welcome credit system
CREATE TABLE public.user_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  phone TEXT,
  amount NUMERIC NOT NULL DEFAULT 150,
  reason TEXT NOT NULL DEFAULT 'welcome',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '14 days'),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Only one unredeemed credit per email (abuse prevention)
CREATE UNIQUE INDEX idx_user_credits_unique_active_email 
ON public.user_credits (email) 
WHERE redeemed_at IS NULL;

-- Only one unredeemed credit per phone (abuse prevention)
CREATE UNIQUE INDEX idx_user_credits_unique_active_phone 
ON public.user_credits (phone) 
WHERE redeemed_at IS NULL AND phone IS NOT NULL;

-- Index for user lookup
CREATE INDEX idx_user_credits_user_id ON public.user_credits (user_id) WHERE redeemed_at IS NULL;

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Users can view their own credits
CREATE POLICY "Users can view their own credits"
ON public.user_credits FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all credits
CREATE POLICY "Admins can view all credits"
ON public.user_credits FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update credits
CREATE POLICY "Admins can update credits"
ON public.user_credits FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to attach credit to user on signup
CREATE OR REPLACE FUNCTION public.attach_credits_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_credits
  SET user_id = NEW.id
  WHERE email = NEW.email
    AND user_id IS NULL
    AND redeemed_at IS NULL
    AND expires_at > now();
  RETURN NEW;
END;
$$;

-- Trigger on user insert
CREATE TRIGGER attach_credits_after_user_insert
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.attach_credits_on_signup();
