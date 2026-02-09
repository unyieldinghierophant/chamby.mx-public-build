
-- Add system message support to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_system_message boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS system_event_type text;

-- Add comment for documentation
COMMENT ON COLUMN public.messages.is_system_message IS 'True for auto-generated status change messages';
COMMENT ON COLUMN public.messages.system_event_type IS 'Event type: accepted, confirmed, en_route, on_site, quoted, in_progress, completed, cancelled';
