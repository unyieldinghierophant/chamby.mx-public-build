
-- 1) Drop existing unsafe policies
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages they received" ON public.messages;

-- 2) New SELECT: only job participants
CREATE POLICY "messages_select_job_participant" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = messages.job_id
      AND (j.provider_id = auth.uid() OR j.client_id = auth.uid())
  )
);

-- 3) New INSERT: sender must be auth.uid(), and sender/receiver must match job's provider/client pair
CREATE POLICY "messages_insert_job_participant" ON public.messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = messages.job_id
      AND (
        (j.provider_id = auth.uid() AND messages.receiver_id = j.client_id)
        OR
        (j.client_id = auth.uid() AND messages.receiver_id = j.provider_id)
      )
  )
);

-- 4) New UPDATE: only receiver can update (read receipts)
CREATE POLICY "messages_update_receiver_only" ON public.messages
FOR UPDATE USING (
  receiver_id = auth.uid()
);

-- 5) Trigger: prevent editing sender_id, receiver_id, job_id, message_text after insert
CREATE OR REPLACE FUNCTION public.prevent_message_tampering()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sender_id IS DISTINCT FROM OLD.sender_id THEN
    RAISE EXCEPTION 'sender_id cannot be changed after insert';
  END IF;
  IF NEW.receiver_id IS DISTINCT FROM OLD.receiver_id THEN
    RAISE EXCEPTION 'receiver_id cannot be changed after insert';
  END IF;
  IF NEW.job_id IS DISTINCT FROM OLD.job_id THEN
    RAISE EXCEPTION 'job_id cannot be changed after insert';
  END IF;
  IF NEW.message_text IS DISTINCT FROM OLD.message_text THEN
    RAISE EXCEPTION 'message_text cannot be changed after insert';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS enforce_message_immutability ON public.messages;

CREATE TRIGGER enforce_message_immutability
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_message_tampering();
