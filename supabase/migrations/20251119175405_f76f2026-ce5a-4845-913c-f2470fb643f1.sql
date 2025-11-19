-- =====================================================
-- COMPREHENSIVE RLS FIX FOR PROVIDER PORTAL
-- =====================================================

-- Drop all broken/outdated policies
DROP POLICY IF EXISTS "providers read job notifications" ON job_notifications;
DROP POLICY IF EXISTS "providers see their notifications" ON job_notifications;
DROP POLICY IF EXISTS "providers update job notifications" ON job_notifications;
DROP POLICY IF EXISTS "providers update their notifications" ON job_notifications;
DROP POLICY IF EXISTS "taskers_read_notifications" ON job_notifications;
DROP POLICY IF EXISTS "taskers_update_notifications" ON job_notifications;

DROP POLICY IF EXISTS "providers_create_jobs" ON jobs;
DROP POLICY IF EXISTS "providers_update_their_jobs" ON jobs;
DROP POLICY IF EXISTS "providers_view_their_jobs" ON jobs;
DROP POLICY IF EXISTS "Authenticated users view active jobs" ON jobs;

DROP POLICY IF EXISTS "Providers can manage their own availability" ON provider_availability;
DROP POLICY IF EXISTS "Anyone can view provider availability" ON provider_availability;

-- =====================================================
-- PROFILES: Core provider identity
-- =====================================================
CREATE POLICY "Providers can read their own profile"
ON profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Providers can update their own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- JOB_NOTIFICATIONS: Provider notifications
-- =====================================================
CREATE POLICY "Providers can read their notifications"
ON job_notifications
FOR SELECT
USING (
  provider_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
  )
);

CREATE POLICY "Providers can update their notifications"
ON job_notifications
FOR UPDATE
USING (
  provider_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
  )
)
WITH CHECK (
  provider_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
  )
);

-- =====================================================
-- JOBS: Provider job listings
-- =====================================================
CREATE POLICY "Providers can read their jobs"
ON jobs
FOR SELECT
USING (
  provider_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
  )
);

CREATE POLICY "Providers can update their jobs"
ON jobs
FOR UPDATE
USING (
  provider_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
  )
)
WITH CHECK (
  provider_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
  )
);

CREATE POLICY "Providers can create jobs"
ON jobs
FOR INSERT
WITH CHECK (
  provider_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
  )
);

-- Allow authenticated users to view active jobs (for job feed)
CREATE POLICY "Authenticated users can view active jobs"
ON jobs
FOR SELECT
USING (
  status = 'active' AND auth.role() = 'authenticated'
);

-- =====================================================
-- PROVIDER_AVAILABILITY: Provider schedule
-- =====================================================
CREATE POLICY "Providers can manage their availability"
ON provider_availability
FOR ALL
USING (provider_id = auth.uid())
WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Public can view provider availability"
ON provider_availability
FOR SELECT
USING (true);