ALTER TABLE public.jobs
  ADD COLUMN followup_scheduled_at timestamptz,
  ADD COLUMN followup_status text,
  ADD COLUMN followup_invoice_id uuid REFERENCES public.invoices(id),
  ADD CONSTRAINT jobs_followup_status_check CHECK (followup_status IN ('scheduled', 'in_progress', 'completed', 'cancelled') OR followup_status IS NULL);