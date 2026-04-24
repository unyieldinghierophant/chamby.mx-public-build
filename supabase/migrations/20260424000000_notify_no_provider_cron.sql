-- Schedule notify-no-provider to run every 30 minutes.
--
-- This is the authoritative path for retiring `searching` jobs whose
-- `assignment_deadline` has passed: it cancels the Stripe visit-fee hold,
-- flips status to `no_match`, and emails the client.
--
-- pg_cron + pg_net are already enabled by a prior migration
-- (20251211201300_b3118df2-...).
--
-- Idempotent: unschedule any previous job with the same name first so
-- re-running the migration doesn't create duplicates.

DO $$
BEGIN
  PERFORM cron.unschedule('notify-no-provider-30min');
EXCEPTION WHEN OTHERS THEN
  -- schedule didn't exist yet — fine
  NULL;
END $$;

SELECT cron.schedule(
  'notify-no-provider-30min',
  '*/30 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://uiyjmjibshnkhwewtkoz.supabase.co/functions/v1/notify-no-provider',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpeWptamlic2hua2h3ZXd0a296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyOTg2NDQsImV4cCI6MjA3Mzg3NDY0NH0.V28ZMZ5SkjHNI6oJNyd3Nv7MlT0kKIvyqhsDWucWV7A"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
