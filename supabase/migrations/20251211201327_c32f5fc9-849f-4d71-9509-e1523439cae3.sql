-- Schedule hourly check for expired visit confirmations
SELECT cron.schedule(
  'check-visit-confirmations-hourly',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://uiyjmjibshnkhwewtkoz.supabase.co/functions/v1/check-visit-confirmations',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpeWptamlic2hua2h3ZXd0a296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyOTg2NDQsImV4cCI6MjA3Mzg3NDY0NH0.V28ZMZ5SkjHNI6oJNyd3Nv7MlT0kKIvyqhsDWucWV7A"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);