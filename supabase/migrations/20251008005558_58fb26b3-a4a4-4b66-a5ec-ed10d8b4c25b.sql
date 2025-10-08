-- Add new columns to profiles table for provider verification and details
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS face_photo_url text,
ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS specialty text,
ADD COLUMN IF NOT EXISTS zone_served text;

-- Create reviews table for client feedback
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL,
  client_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Providers can view their own reviews
CREATE POLICY "Providers can view their reviews"
ON reviews FOR SELECT
USING (
  provider_id IN (
    SELECT user_id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Clients can create reviews for completed bookings
CREATE POLICY "Clients can create reviews"
ON reviews FOR INSERT
WITH CHECK (
  client_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE id = booking_id 
    AND customer_id = auth.uid()
    AND status = 'completed'
  )
);

-- Clients can view their own reviews
CREATE POLICY "Clients can view their reviews"
ON reviews FOR SELECT
USING (client_id = auth.uid());

-- Create invoices/quotes table
CREATE TABLE IF NOT EXISTS provider_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  amount numeric NOT NULL,
  description text,
  invoice_photo_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on provider_invoices table
ALTER TABLE provider_invoices ENABLE ROW LEVEL SECURITY;

-- Providers can manage their own invoices
CREATE POLICY "Providers can view their invoices"
ON provider_invoices FOR SELECT
USING (
  provider_id IN (
    SELECT user_id FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Providers can create invoices"
ON provider_invoices FOR INSERT
WITH CHECK (
  provider_id IN (
    SELECT user_id FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Providers can update their invoices"
ON provider_invoices FOR UPDATE
USING (
  provider_id IN (
    SELECT user_id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Clients can view invoices sent to them
CREATE POLICY "Clients can view their invoices"
ON provider_invoices FOR SELECT
USING (client_id = auth.uid());

-- Create storage bucket for provider photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('provider-photos', 'provider-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for provider photos
CREATE POLICY "Providers can upload their photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'provider-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Providers can update their photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'provider-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view provider photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'provider-photos');

-- Create trigger to update rating when new review is added
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    rating = (
      SELECT AVG(rating)::numeric(3,2)
      FROM reviews
      WHERE provider_id = NEW.provider_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE provider_id = NEW.provider_id
    ),
    updated_at = now()
  WHERE user_id = NEW.provider_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_rating_on_review
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_provider_rating();

-- Create trigger for updated_at on reviews
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on provider_invoices
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON provider_invoices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();