-- Create refund_requests table
CREATE TABLE public.refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id),
  client_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  requested_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Clients can insert their own refund requests
CREATE POLICY "clients_insert_own_refund_requests"
  ON public.refund_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

-- Clients can view their own refund requests
CREATE POLICY "clients_select_own_refund_requests"
  ON public.refund_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

-- Providers can view refund requests for their jobs
CREATE POLICY "providers_select_job_refund_requests"
  ON public.refund_requests FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = refund_requests.job_id
    AND jobs.provider_id = auth.uid()
  ));

-- Admins can view all refund requests
CREATE POLICY "admins_select_all_refund_requests"
  ON public.refund_requests FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update refund requests
CREATE POLICY "admins_update_refund_requests"
  ON public.refund_requests FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.refund_requests;