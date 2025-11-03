-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  job_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'released', 'held', 'withdrawn')),
  type TEXT NOT NULL DEFAULT 'job_payment' CHECK (type IN ('job_payment', 'bonus', 'penalty')),
  payment_method TEXT,
  transaction_id TEXT,
  released_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create job_visits table
CREATE TABLE IF NOT EXISTS public.job_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  visit_type TEXT NOT NULL DEFAULT 'initial' CHECK (visit_type IN ('initial', 'follow_up', 'inspection')),
  notes TEXT,
  evidence_photos TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create job_tracking table for real-time GPS
CREATE TABLE IF NOT EXISTS public.job_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  latitude NUMERIC(10,8) NOT NULL,
  longitude NUMERIC(11,8) NOT NULL,
  status TEXT NOT NULL DEFAULT 'en_route' CHECK (status IN ('en_route', 'arrived', 'in_progress', 'completed')),
  route_polyline TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create messages table for job-based chat
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  attachment_url TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('job_assigned', 'payment_received', 'verification_approved', 'support_ticket', 'chat_message', 'job_update', 'review_received')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create provider_availability table
CREATE TABLE IF NOT EXISTS public.provider_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_visits_job ON job_visits(job_id);
CREATE INDEX IF NOT EXISTS idx_job_visits_scheduled ON job_visits(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_job_tracking_job ON job_tracking(job_id);
CREATE INDEX IF NOT EXISTS idx_job_tracking_provider ON job_tracking(provider_id);
CREATE INDEX IF NOT EXISTS idx_job_tracking_updated ON job_tracking(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_job ON messages(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_availability_provider ON provider_availability(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_availability_date ON provider_availability(date);

-- Enable RLS on all tables
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Providers can view their own payments"
  ON payments FOR SELECT
  USING (provider_id = auth.uid());

CREATE POLICY "Providers can insert their own payments"
  ON payments FOR INSERT
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Providers can update their own payments"
  ON payments FOR UPDATE
  USING (provider_id = auth.uid());

-- RLS Policies for job_visits
CREATE POLICY "Users can view visits for their jobs"
  ON job_visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = job_visits.job_id 
      AND (bookings.tasker_id = auth.uid() OR bookings.customer_id = auth.uid())
    )
  );

CREATE POLICY "Providers can create visits for their jobs"
  ON job_visits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = job_visits.job_id 
      AND bookings.tasker_id = auth.uid()
    )
  );

CREATE POLICY "Providers can update visits for their jobs"
  ON job_visits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = job_visits.job_id 
      AND bookings.tasker_id = auth.uid()
    )
  );

-- RLS Policies for job_tracking
CREATE POLICY "Providers can manage their own tracking"
  ON job_tracking FOR ALL
  USING (provider_id = auth.uid());

CREATE POLICY "Clients can view tracking for their jobs"
  ON job_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = job_tracking.job_id 
      AND bookings.customer_id = auth.uid()
    )
  );

-- RLS Policies for messages
CREATE POLICY "Users can view messages they sent or received"
  ON messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update messages they received"
  ON messages FOR UPDATE
  USING (receiver_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for provider_availability
CREATE POLICY "Providers can manage their own availability"
  ON provider_availability FOR ALL
  USING (provider_id = auth.uid());

CREATE POLICY "Anyone can view provider availability"
  ON provider_availability FOR SELECT
  USING (TRUE);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_visits_updated_at BEFORE UPDATE ON job_visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_tracking_updated_at BEFORE UPDATE ON job_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();