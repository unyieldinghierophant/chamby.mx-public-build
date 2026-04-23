-- ============================================================
-- Real-time chat system (admin ↔ client, admin ↔ provider, admin ↔ user support)
--
-- conversation_id format:
--   dispute_{disputeId}_client   — admin ↔ client thread for a dispute
--   dispute_{disputeId}_provider — admin ↔ provider thread for the same dispute
--   support_{userId}             — generic admin ↔ user support inbox
-- ============================================================

-- ── 1. Tables ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
  id                  text        PRIMARY KEY,
  type                text        NOT NULL CHECK (type IN ('dispute_client','dispute_provider','support')),
  booking_id          uuid        REFERENCES public.jobs(id) ON DELETE CASCADE,
  dispute_id          uuid        REFERENCES public.disputes(id) ON DELETE CASCADE,
  participant_user_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_name    text,
  participant_role    text        CHECK (participant_role IN ('client','provider')),
  last_message_text   text,
  last_message_at     timestamptz,
  unread_count_admin  integer     NOT NULL DEFAULT 0,
  unread_count_user   integer     NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id text        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role     text        NOT NULL CHECK (sender_role IN ('admin','client','provider')),
  message         text        NOT NULL,
  attachments     jsonb,
  is_read         boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created
  ON public.chat_messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread
  ON public.chat_messages (conversation_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_conversations_type_last
  ON public.conversations (type, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_conversations_participant
  ON public.conversations (participant_user_id);

-- ── 2. RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- conversations: admin full access, participant can read/update their own row
DROP POLICY IF EXISTS "Admin full access to conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participant can view own conversation" ON public.conversations;
DROP POLICY IF EXISTS "Participant can update own conversation" ON public.conversations;

CREATE POLICY "Admin full access to conversations"
  ON public.conversations FOR ALL
  USING (auth.uid() = '30c2aa13-4338-44ca-8c74-d60421ed9bfc'::uuid)
  WITH CHECK (auth.uid() = '30c2aa13-4338-44ca-8c74-d60421ed9bfc'::uuid);

CREATE POLICY "Participant can view own conversation"
  ON public.conversations FOR SELECT
  USING (auth.uid() = participant_user_id);

CREATE POLICY "Participant can update own conversation"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = participant_user_id);

-- chat_messages: admin full access, participants can read/insert in their conversation
DROP POLICY IF EXISTS "Admin full access to chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Participant can view chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Participant can insert chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Participant can update read status" ON public.chat_messages;

CREATE POLICY "Admin full access to chat_messages"
  ON public.chat_messages FOR ALL
  USING (auth.uid() = '30c2aa13-4338-44ca-8c74-d60421ed9bfc'::uuid)
  WITH CHECK (auth.uid() = '30c2aa13-4338-44ca-8c74-d60421ed9bfc'::uuid);

CREATE POLICY "Participant can view chat_messages"
  ON public.chat_messages FOR SELECT
  USING (
    auth.uid() IN (
      SELECT participant_user_id FROM public.conversations
      WHERE id = chat_messages.conversation_id
    )
  );

CREATE POLICY "Participant can insert chat_messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role IN ('client','provider')
    AND auth.uid() IN (
      SELECT participant_user_id FROM public.conversations
      WHERE id = chat_messages.conversation_id
    )
  );

CREATE POLICY "Participant can update read status"
  ON public.chat_messages FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT participant_user_id FROM public.conversations
      WHERE id = chat_messages.conversation_id
    )
  );

-- ── 3. Realtime publication ────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- ── 4. Trigger: keep conversation metadata fresh on message insert ─────────
-- Requires pg_net (pre-enabled on every Supabase project) so the trigger can
-- fire-and-forget a POST to the notify-admin-chat edge function.
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.tg_chat_messages_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  preview text := LEFT(NEW.message, 200);
BEGIN
  IF NEW.sender_role = 'admin' THEN
    UPDATE public.conversations
       SET last_message_text = preview,
           last_message_at   = NEW.created_at,
           unread_count_user = unread_count_user + 1
     WHERE id = NEW.conversation_id;
  ELSE
    UPDATE public.conversations
       SET last_message_text  = preview,
           last_message_at    = NEW.created_at,
           unread_count_admin = unread_count_admin + 1
     WHERE id = NEW.conversation_id;

    -- Fire-and-forget call to notify-admin-chat. The function has
    -- verify_jwt = false so no auth is needed; it will wait 30s and only
    -- notify if the message is still unread.
    BEGIN
      PERFORM net.http_post(
        url     := 'https://uiyjmjibshnkhwewtkoz.supabase.co/functions/v1/notify-admin-chat',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body    := jsonb_build_object('message_id', NEW.id)
      );
    EXCEPTION WHEN OTHERS THEN
      -- Never block the insert on a failed notification hop
      RAISE WARNING 'notify-admin-chat dispatch failed: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chat_messages_after_insert ON public.chat_messages;
CREATE TRIGGER chat_messages_after_insert
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.tg_chat_messages_after_insert();

-- ── 5. Storage bucket for chat attachments ─────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Chat attachments: participants can read"      ON storage.objects;
DROP POLICY IF EXISTS "Chat attachments: authenticated can upload"   ON storage.objects;

CREATE POLICY "Chat attachments: participants can read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-attachments');

CREATE POLICY "Chat attachments: authenticated can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');
