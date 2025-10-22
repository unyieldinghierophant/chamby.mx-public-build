-- Create table for short URL mappings
CREATE TABLE photo_short_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code text UNIQUE NOT NULL,
  full_url text NOT NULL,
  job_request_id uuid REFERENCES job_requests(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  clicks integer DEFAULT 0
);

-- Index for fast lookups
CREATE INDEX idx_short_code ON photo_short_links(short_code);

-- Enable RLS
ALTER TABLE photo_short_links ENABLE ROW LEVEL SECURITY;

-- Public can read short links (for redirect)
CREATE POLICY "Anyone can read short links"
ON photo_short_links FOR SELECT
USING (true);

-- Only authenticated users can create short links
CREATE POLICY "Authenticated users can create short links"
ON photo_short_links FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Function to generate random 6-character short codes
CREATE OR REPLACE FUNCTION generate_short_code()
RETURNS text AS $$
DECLARE
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;