
ALTER TABLE service_subcategories 
ADD COLUMN IF NOT EXISTS description text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_subcategories_category_id_slug_key'
  ) THEN
    ALTER TABLE service_subcategories ADD CONSTRAINT service_subcategories_category_id_slug_key UNIQUE (category_id, slug);
  END IF;
END $$;
