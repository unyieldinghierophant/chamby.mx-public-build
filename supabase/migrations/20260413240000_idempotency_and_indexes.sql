-- Idempotency constraints to prevent duplicate payments/payouts from webhook retries
-- and race conditions in settlement.

-- 1. Prevent duplicate payment records from the same Stripe checkout session
--    (Stripe can fire checkout.session.completed more than once on retry)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_checkout_session_unique
  ON payments(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

-- 2. Prevent duplicate payouts for the same job + type
--    (settlement idempotency — checked in code but enforced here at DB level)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payouts_job_payout_type_unique
  ON payouts(job_id, payout_type);

-- 3. Performance indexes for common query patterns

-- Jobs: provider portal loads jobs by provider_id + status
CREATE INDEX IF NOT EXISTS idx_jobs_provider_id ON jobs(provider_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);
-- Composite for "all active jobs for this provider"
CREATE INDEX IF NOT EXISTS idx_jobs_provider_status ON jobs(provider_id, status);

-- Invoices: most lookups are by job_id
CREATE INDEX IF NOT EXISTS idx_invoices_job_id ON invoices(job_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);

-- Payments: settlement queries by job_id + type + status
CREATE INDEX IF NOT EXISTS idx_payments_job_type_status ON payments(job_id, type, status);

-- Notifications: user inbox loads by user_id + read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

-- Documents: verification admin view loads by provider_id
CREATE INDEX IF NOT EXISTS idx_documents_provider_id ON documents(provider_id);
