-- ============================================================================
-- 5-day automated payout hold.
--
-- When a job completes, we create the payout row immediately with
-- status = 'holding' and release_after = now() + 5 days. The Stripe transfer
-- does NOT run at completion time — the `auto-complete-jobs` cron processes
-- `holding` payouts whose `release_after` has passed and promotes them to
-- `released`.
--
-- Status vocabulary:
--   pending   — reserved for future use (e.g. awaiting invoice paid)
--   holding   — payout recorded, 5-day window running
--   released  — Stripe transfer succeeded (released_at set)
--   failed    — Stripe transfer failed; admin needs to investigate
--   cancelled — admin cancelled the payout (no transfer)
-- Legacy values still present in existing rows:
--   paid                            — equivalent to `released`
--   awaiting_provider_onboarding    — payout blocked until provider onboards
-- ============================================================================

ALTER TABLE public.payouts
  ADD COLUMN IF NOT EXISTS release_after timestamptz,
  ADD COLUMN IF NOT EXISTS released_at   timestamptz;

-- Cron lookup: "which holding payouts are ready to release right now?"
CREATE INDEX IF NOT EXISTS idx_payouts_holding_release_after
  ON public.payouts (release_after)
  WHERE status = 'holding';

COMMENT ON COLUMN public.payouts.release_after IS
  'UTC timestamp when the 5-day hold expires and the payout becomes eligible for Stripe transfer.';
COMMENT ON COLUMN public.payouts.released_at IS
  'UTC timestamp of the Stripe transfer (holding → released transition).';
COMMENT ON COLUMN public.payouts.status IS
  'pending | holding | released | failed | cancelled. Legacy: paid (= released), awaiting_provider_onboarding.';
