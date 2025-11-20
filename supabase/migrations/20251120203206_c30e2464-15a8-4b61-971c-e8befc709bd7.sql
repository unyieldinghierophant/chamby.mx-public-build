-- Add location tracking columns to provider_details
ALTER TABLE provider_details
ADD COLUMN IF NOT EXISTS current_latitude NUMERIC,
ADD COLUMN IF NOT EXISTS current_longitude NUMERIC,
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP WITH TIME ZONE;

-- Create index for faster location queries
CREATE INDEX IF NOT EXISTS idx_provider_details_location 
ON provider_details(current_latitude, current_longitude) 
WHERE current_latitude IS NOT NULL AND current_longitude IS NOT NULL;