-- Create saved_locations table
CREATE TABLE public.saved_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  address text NOT NULL,
  latitude numeric,
  longitude numeric,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved locations
CREATE POLICY "Users can view their own saved locations"
ON public.saved_locations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own saved locations
CREATE POLICY "Users can insert their own saved locations"
ON public.saved_locations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved locations
CREATE POLICY "Users can update their own saved locations"
ON public.saved_locations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved locations
CREATE POLICY "Users can delete their own saved locations"
ON public.saved_locations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_saved_locations_updated_at
BEFORE UPDATE ON public.saved_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();