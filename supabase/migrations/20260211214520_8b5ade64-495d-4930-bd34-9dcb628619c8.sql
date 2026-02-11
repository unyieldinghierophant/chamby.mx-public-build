-- Add foreign key constraints to support_messages
ALTER TABLE public.support_messages
  ADD CONSTRAINT support_messages_provider_fkey
  FOREIGN KEY (provider_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.support_messages
  ADD CONSTRAINT support_messages_sender_fkey
  FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Strengthen provider insert policy to require provider role
DROP POLICY IF EXISTS "Providers can send support messages" ON public.support_messages;

CREATE POLICY "Providers can send support messages"
ON public.support_messages FOR INSERT
WITH CHECK (
  auth.uid() = provider_id 
  AND auth.uid() = sender_id
  AND has_role(auth.uid(), 'provider'::app_role)
);