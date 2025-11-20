-- Restore photo_short_links table that was accidentally dropped
CREATE TABLE IF NOT EXISTS public.photo_short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code TEXT NOT NULL UNIQUE,
  full_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.photo_short_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "photo_short_links_select_all" ON public.photo_short_links
  FOR SELECT USING (true);

CREATE POLICY "photo_short_links_insert_auth" ON public.photo_short_links
  FOR INSERT WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "photo_short_links_update_all" ON public.photo_short_links
  FOR UPDATE USING (true);