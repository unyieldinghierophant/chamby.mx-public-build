-- Bug 9: add hold_expires_at for the 2-hour grace period after a searching
-- job expires.
--
-- When notify-no-provider flips a job to `no_match` it no longer cancels the
-- Stripe hold immediately. Instead it sets hold_expires_at = NOW() + 2h. The
-- auto-complete-jobs cron cancels the hold once that timestamp passes. The
-- client can "Intentar de nuevo" during the window without losing their spot.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS hold_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_jobs_no_match_hold_expiry
  ON public.jobs (hold_expires_at)
  WHERE status = 'no_match' AND hold_expires_at IS NOT NULL;
