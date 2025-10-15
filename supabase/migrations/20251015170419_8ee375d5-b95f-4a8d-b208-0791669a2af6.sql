-- Create job_requests table
CREATE TABLE public.job_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  service TEXT NOT NULL,
  date TEXT,
  time_preference TEXT,
  exact_time TEXT,
  location TEXT,
  details TEXT,
  budget TEXT,
  photo_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_requests ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own requests
CREATE POLICY "Users can insert their own job requests"
ON public.job_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own requests
CREATE POLICY "Users can view their own job requests"
ON public.job_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Allow anonymous users to insert (for non-authenticated flows)
CREATE POLICY "Anyone can insert job requests"
ON public.job_requests
FOR INSERT
WITH CHECK (true);