ALTER TABLE public.invoices
  ADD COLUMN valid_until timestamptz,
  ADD COLUMN requires_followup_visit boolean NOT NULL DEFAULT false,
  ADD COLUMN proposed_visit_window tstzrange,
  ADD COLUMN notes text;