
-- Add rejection_reason to invoices for client feedback
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Allow clients to update invoice status (accept/reject sent invoices)
CREATE POLICY "Clients can accept or reject sent invoices"
ON public.invoices
FOR UPDATE
USING (auth.uid() = user_id AND status = 'sent')
WITH CHECK (auth.uid() = user_id AND status IN ('accepted', 'rejected'));

-- Allow clients to update accepted invoices to mark payment intent (status stays accepted until webhook sets paid)
-- This is needed so the edge function (using service role) can update, but also for future flexibility
