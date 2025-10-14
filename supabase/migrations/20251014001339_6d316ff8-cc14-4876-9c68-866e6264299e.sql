-- Create service_requests table
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_type TEXT NOT NULL,
  service_date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own service requests"
ON public.service_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own service requests"
ON public.service_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Create storage bucket for service request images
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-requests', 'service-requests', true);

-- Create storage policies
CREATE POLICY "Users can upload their own service request images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'service-requests' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service request images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'service-requests');