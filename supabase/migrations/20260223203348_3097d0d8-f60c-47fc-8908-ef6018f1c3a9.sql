
-- Create disputes table
CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id),
  opened_by_user_id uuid NOT NULL,
  opened_by_role text NOT NULL CHECK (opened_by_role IN ('client', 'provider')),
  reason_code text NOT NULL CHECK (reason_code IN ('no_show', 'bad_service', 'pricing_dispute', 'damage', 'other')),
  reason_text text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved_release', 'resolved_refund', 'resolved_cancelled')),
  resolution_notes text,
  resolved_by_admin_id uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add dispute columns to jobs
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS has_open_dispute boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dispute_status text;

-- Enable RLS
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- RLS: clients can view disputes for their jobs
CREATE POLICY "Clients can view disputes for their jobs"
  ON public.disputes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.jobs WHERE jobs.id = disputes.job_id AND jobs.client_id = auth.uid()
  ));

-- RLS: providers can view disputes for their jobs
CREATE POLICY "Providers can view disputes for their jobs"
  ON public.disputes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.jobs WHERE jobs.id = disputes.job_id AND jobs.provider_id = auth.uid()
  ));

-- RLS: clients can insert disputes for their jobs
CREATE POLICY "Clients can insert disputes for their jobs"
  ON public.disputes FOR INSERT
  WITH CHECK (
    auth.uid() = opened_by_user_id
    AND opened_by_role = 'client'
    AND EXISTS (
      SELECT 1 FROM public.jobs WHERE jobs.id = disputes.job_id AND jobs.client_id = auth.uid()
    )
  );

-- RLS: providers can insert disputes for their jobs
CREATE POLICY "Providers can insert disputes for their jobs"
  ON public.disputes FOR INSERT
  WITH CHECK (
    auth.uid() = opened_by_user_id
    AND opened_by_role = 'provider'
    AND EXISTS (
      SELECT 1 FROM public.jobs WHERE jobs.id = disputes.job_id AND jobs.provider_id = auth.uid()
    )
  );

-- RLS: admins can view all disputes
CREATE POLICY "Admins can view all disputes"
  ON public.disputes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS: admins can update disputes
CREATE POLICY "Admins can update disputes"
  ON public.disputes FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));
