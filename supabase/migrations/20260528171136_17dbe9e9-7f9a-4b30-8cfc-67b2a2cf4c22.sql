CREATE TABLE public.admin_live_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL DEFAULT '2020-01-01T00:00:00Z',
  ad_spend NUMERIC NOT NULL DEFAULT 0,
  reset_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_live_counter_singleton CHECK (id = 1)
);

INSERT INTO public.admin_live_counter (id) VALUES (1) ON CONFLICT DO NOTHING;

GRANT SELECT, INSERT, UPDATE ON public.admin_live_counter TO authenticated;
GRANT ALL ON public.admin_live_counter TO service_role;

ALTER TABLE public.admin_live_counter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read live counter"
  ON public.admin_live_counter FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email') IN ('ewhz3384@gmail.com', 'elkhabirmalik@gmail.com'));

CREATE POLICY "Admins can update live counter"
  ON public.admin_live_counter FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'email') IN ('ewhz3384@gmail.com', 'elkhabirmalik@gmail.com'))
  WITH CHECK ((auth.jwt() ->> 'email') IN ('ewhz3384@gmail.com', 'elkhabirmalik@gmail.com'));

CREATE POLICY "Admins can insert live counter"
  ON public.admin_live_counter FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'email') IN ('ewhz3384@gmail.com', 'elkhabirmalik@gmail.com'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_live_counter;