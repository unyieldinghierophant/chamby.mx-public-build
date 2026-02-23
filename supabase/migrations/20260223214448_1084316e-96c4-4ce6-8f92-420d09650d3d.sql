
-- Stripe sync logs for backfill auditing
CREATE TABLE public.stripe_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  stripe_account_id text NOT NULL,
  status text NOT NULL, -- 'success' | 'error'
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync logs"
  ON public.stripe_sync_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert sync logs"
  ON public.stripe_sync_logs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
