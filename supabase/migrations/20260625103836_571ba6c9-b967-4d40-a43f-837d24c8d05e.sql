CREATE TABLE public.admin_personal_tallies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL UNIQUE,
  adjustments JSONB NOT NULL DEFAULT '[]'::jsonb,
  reset_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_personal_tallies TO authenticated;
GRANT ALL ON public.admin_personal_tallies TO service_role;

ALTER TABLE public.admin_personal_tallies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own personal tally"
ON public.admin_personal_tallies
FOR ALL
TO authenticated
USING (lower(auth.jwt()->>'email') = lower(admin_email))
WITH CHECK (lower(auth.jwt()->>'email') = lower(admin_email));