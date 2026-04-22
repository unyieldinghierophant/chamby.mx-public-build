-- ============================================================
-- Conflict Resolution System
-- ============================================================

-- ── 1. New columns on jobs ──────────────────────────────────
-- Note: reschedule_requested_at already exists, skipped
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS cancellation_requested_by           text,
  ADD COLUMN IF NOT EXISTS cancellation_requested_at           timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_agreed_by_other_side   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reschedule_requested_by             text,
  ADD COLUMN IF NOT EXISTS reschedule_proposed_datetime        timestamptz,
  ADD COLUMN IF NOT EXISTS reschedule_agreed                   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS job_completed_confirmed             boolean,
  ADD COLUMN IF NOT EXISTS late_cancellation_penalty_applied   boolean DEFAULT false;

-- ── 2. New columns on users ──────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS flag_count               integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS account_status           text    DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS pending_penalty_balance  integer DEFAULT 0;

-- ── 3. Missing columns on existing disputes table ────────────
-- disputes already exists with job_id, opened_by_role, reason_code, reason_text, resolution_notes
ALTER TABLE public.disputes
  ADD COLUMN IF NOT EXISTS opened_by               text,
  ADD COLUMN IF NOT EXISTS reason                  text,
  ADD COLUMN IF NOT EXISTS description             text,
  ADD COLUMN IF NOT EXISTS admin_ruling            text,
  ADD COLUMN IF NOT EXISTS split_percentage_client integer,
  ADD COLUMN IF NOT EXISTS admin_notes             text;

-- ── 4. dispute_evidence ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dispute_evidence (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id           uuid        NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  uploaded_by_user_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_by_role     text        NOT NULL,
  file_url             text        NOT NULL,
  file_type            text        NOT NULL,
  description          text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ── 5. account_flags ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.account_flags (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason      text        NOT NULL,
  flagged_by  text        NOT NULL,
  booking_id  uuid        REFERENCES public.jobs(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 6. admin_notifications ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type                  text        NOT NULL,
  booking_id            uuid        NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  triggered_by_user_id  uuid        NOT NULL,
  message               text        NOT NULL,
  is_read               boolean     NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ── 7. Enable RLS ─────────────────────────────────────────────
ALTER TABLE public.dispute_evidence    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_flags       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- ── 8. RLS: disputes ──────────────────────────────────────────
-- Drop first in case they exist from a previous attempt
DROP POLICY IF EXISTS "Users can view their own disputes"      ON public.disputes;
DROP POLICY IF EXISTS "Users can insert disputes for their own jobs" ON public.disputes;
DROP POLICY IF EXISTS "Admin full access to disputes"          ON public.disputes;

CREATE POLICY "Users can view their own disputes"
  ON public.disputes FOR SELECT
  USING (
    auth.uid() = opened_by_user_id
    OR auth.uid() IN (
      SELECT client_id   FROM public.jobs WHERE id = job_id
      UNION
      SELECT provider_id FROM public.jobs WHERE id = job_id
    )
  );

CREATE POLICY "Users can insert disputes for their own jobs"
  ON public.disputes FOR INSERT
  WITH CHECK (
    auth.uid() = opened_by_user_id
    AND auth.uid() IN (
      SELECT client_id   FROM public.jobs WHERE id = job_id
      UNION
      SELECT provider_id FROM public.jobs WHERE id = job_id
    )
  );

CREATE POLICY "Admin full access to disputes"
  ON public.disputes FOR ALL
  USING (auth.uid() = '30c2aa13-4338-44ca-8c74-d60421ed9bfc'::uuid);

-- ── 9. RLS: dispute_evidence ──────────────────────────────────
CREATE POLICY "Users can view evidence for their disputes"
  ON public.dispute_evidence FOR SELECT
  USING (
    auth.uid() = uploaded_by_user_id
    OR auth.uid() IN (
      SELECT j.client_id FROM public.jobs j
      JOIN public.disputes d ON d.job_id = j.id
      WHERE d.id = dispute_id
      UNION
      SELECT j.provider_id FROM public.jobs j
      JOIN public.disputes d ON d.job_id = j.id
      WHERE d.id = dispute_id
    )
  );

CREATE POLICY "Users can upload evidence for their disputes"
  ON public.dispute_evidence FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by_user_id
    AND auth.uid() IN (
      SELECT j.client_id FROM public.jobs j
      JOIN public.disputes d ON d.job_id = j.id
      WHERE d.id = dispute_id
      UNION
      SELECT j.provider_id FROM public.jobs j
      JOIN public.disputes d ON d.job_id = j.id
      WHERE d.id = dispute_id
    )
  );

CREATE POLICY "Admin full access to dispute_evidence"
  ON public.dispute_evidence FOR ALL
  USING (auth.uid() = '30c2aa13-4338-44ca-8c74-d60421ed9bfc'::uuid);

-- ── 10. RLS: account_flags ────────────────────────────────────
CREATE POLICY "Users can view their own flags"
  ON public.account_flags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin full access to account_flags"
  ON public.account_flags FOR ALL
  USING (auth.uid() = '30c2aa13-4338-44ca-8c74-d60421ed9bfc'::uuid);

-- ── 11. RLS: admin_notifications ──────────────────────────────
CREATE POLICY "Admin only access to admin_notifications"
  ON public.admin_notifications FOR ALL
  USING (auth.uid() = '30c2aa13-4338-44ca-8c74-d60421ed9bfc'::uuid);
