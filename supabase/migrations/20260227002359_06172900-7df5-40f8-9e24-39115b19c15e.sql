
CREATE TABLE public.visitor_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL UNIQUE,
  current_page text NOT NULL DEFAULT '/',
  cart_items jsonb DEFAULT '[]'::jsonb,
  cart_total numeric DEFAULT 0,
  is_in_checkout boolean DEFAULT false,
  country text,
  city text,
  region text,
  device_type text,
  browser text,
  os text,
  screen_width integer,
  referrer text,
  pages_viewed jsonb DEFAULT '[]'::jsonb,
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for quick active session lookups
CREATE INDEX idx_visitor_sessions_last_seen ON public.visitor_sessions (last_seen_at DESC);

-- Enable RLS but no policies (service role only access for reads, edge function for writes)
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;

-- Auto-cleanup: delete sessions older than 24 hours via a cron-like approach
-- We'll handle cleanup in the edge function instead

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_sessions;
