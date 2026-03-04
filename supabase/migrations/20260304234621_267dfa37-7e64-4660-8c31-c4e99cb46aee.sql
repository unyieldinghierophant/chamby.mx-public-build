-- Step 1: Map old status values to new canonical ones
UPDATE jobs SET status = 'assigned' WHERE status = 'active';
UPDATE jobs SET status = 'assigned' WHERE status = 'accepted';
UPDATE jobs SET status = 'assigned' WHERE status = 'confirmed';
UPDATE jobs SET status = 'on_site' WHERE status = 'en_route';
UPDATE jobs SET status = 'cancelled' WHERE status = 'unassigned';
UPDATE jobs SET status = 'searching' WHERE status = 'scheduled';

-- Step 2: Fix completion_status default
ALTER TABLE jobs ALTER COLUMN completion_status SET DEFAULT 'pending';
UPDATE jobs SET completion_status = 'pending' WHERE completion_status = 'in_progress' AND status = 'pending';

-- Step 3: Add CHECK constraint (all old values have been migrated above)
ALTER TABLE jobs ADD CONSTRAINT valid_job_status CHECK (
  status IN ('pending','searching','assigned','on_site','quoted','quote_accepted','quote_rejected','job_paid','in_progress','provider_done','completed','cancelled','disputed','no_match')
);