
-- Support messages table for provider-admin chat
CREATE TABLE public.support_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message_text text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_support_messages_provider ON public.support_messages (provider_id, created_at DESC);
CREATE INDEX idx_support_messages_unread ON public.support_messages (provider_id, read) WHERE read = false;

-- Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Providers can view their own support thread
CREATE POLICY "Providers can view their support messages"
ON public.support_messages
FOR SELECT
USING (auth.uid() = provider_id);

-- Providers can insert messages in their own thread
CREATE POLICY "Providers can send support messages"
ON public.support_messages
FOR INSERT
WITH CHECK (auth.uid() = provider_id AND auth.uid() = sender_id);

-- Admins can view all support messages
CREATE POLICY "Admins can view all support messages"
ON public.support_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can send messages to any provider thread
CREATE POLICY "Admins can send support messages"
ON public.support_messages
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = sender_id);

-- Admins can update (mark as read)
CREATE POLICY "Admins can update support messages"
ON public.support_messages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Providers can mark messages as read in their thread
CREATE POLICY "Providers can mark messages read"
ON public.support_messages
FOR UPDATE
USING (auth.uid() = provider_id);
