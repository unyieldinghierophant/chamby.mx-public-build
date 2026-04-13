-- Rate limiting table for edge functions.
-- Each row tracks request count within a rolling window per key.

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No RLS needed — only accessed via service role from edge functions.
ALTER TABLE public.rate_limits DISABLE ROW LEVEL SECURITY;

-- Function: atomically increment or reset the counter.
-- Returns { count, window_start } so the caller can compute remaining/reset.
CREATE OR REPLACE FUNCTION public.upsert_rate_limit(
  p_key TEXT,
  p_window_secs INTEGER,
  p_limit INTEGER
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_window_cutoff TIMESTAMPTZ := v_now - (p_window_secs * INTERVAL '1 second');
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Try to insert a fresh record (first request in window)
  INSERT INTO public.rate_limits (key, count, window_start, updated_at)
  VALUES (p_key, 1, v_now, v_now)
  ON CONFLICT (key) DO UPDATE SET
    -- If the existing window has expired, reset it
    count = CASE
      WHEN rate_limits.window_start < v_window_cutoff THEN 1
      ELSE rate_limits.count + 1
    END,
    window_start = CASE
      WHEN rate_limits.window_start < v_window_cutoff THEN v_now
      ELSE rate_limits.window_start
    END,
    updated_at = v_now
  RETURNING count, window_start INTO v_count, v_window_start;

  RETURN jsonb_build_object('count', v_count, 'window_start', v_window_start);
END;
$$;

-- Cleanup job: purge stale rate limit records older than 1 hour to keep table small.
-- Run via pg_cron or manually; not required for correctness.
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM public.rate_limits WHERE updated_at < NOW() - INTERVAL '1 hour';
$$;
