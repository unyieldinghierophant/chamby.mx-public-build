-- Create jobs table for TaskRabbit-style job marketplace
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  rate numeric NOT NULL CHECK (rate > 0),
  provider_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed'))
);

-- Add foreign key constraint to link jobs to clients (providers)
ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_provider_id_fkey 
FOREIGN KEY (provider_id) REFERENCES public.clients(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for jobs table
CREATE POLICY "Providers can create their own jobs" 
ON public.jobs 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = provider_id 
    AND email = (auth.uid())::text 
    AND role = 'provider'
  )
);

CREATE POLICY "Providers can view and update their own jobs" 
ON public.jobs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = provider_id 
    AND email = (auth.uid())::text 
    AND role = 'provider'
  )
);

CREATE POLICY "Providers can update their own jobs" 
ON public.jobs 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = provider_id 
    AND email = (auth.uid())::text 
    AND role = 'provider'
  )
);

CREATE POLICY "Providers can delete their own jobs" 
ON public.jobs 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = provider_id 
    AND email = (auth.uid())::text 
    AND role = 'provider'
  )
);

CREATE POLICY "Everyone can view active jobs" 
ON public.jobs 
FOR SELECT 
USING (status = 'active');

-- Create indexes for better performance
CREATE INDEX idx_jobs_provider_id ON public.jobs(provider_id);
CREATE INDEX idx_jobs_category ON public.jobs(category);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at DESC);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();