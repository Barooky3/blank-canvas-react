
CREATE TABLE public.tracking_lookups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  order_number INTEGER NOT NULL,
  matched BOOLEAN NOT NULL DEFAULT false,
  ip_hint TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tracking_lookups TO authenticated;
GRANT ALL ON public.tracking_lookups TO service_role;

ALTER TABLE public.tracking_lookups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only specific admins can view tracking lookups"
ON public.tracking_lookups
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'email') IN ('ewhz3384@gmail.com', 'mirzau2017@gmail.com')
);

CREATE INDEX idx_tracking_lookups_created_at ON public.tracking_lookups (created_at DESC);
