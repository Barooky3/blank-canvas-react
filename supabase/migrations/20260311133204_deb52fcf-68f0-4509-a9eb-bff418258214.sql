
CREATE TABLE public.banned_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  banned_by text NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- Public can read to check if they're banned
CREATE POLICY "Anyone can check bans" ON public.banned_users
  FOR SELECT TO public USING (true);
