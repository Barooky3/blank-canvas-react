
CREATE TABLE public.product_padding_overrides (
  product_id text PRIMARY KEY,
  padding_top numeric NOT NULL DEFAULT 0,
  padding_right numeric NOT NULL DEFAULT 0,
  padding_bottom numeric NOT NULL DEFAULT 0,
  padding_left numeric NOT NULL DEFAULT 0,
  scale numeric NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_padding_overrides TO anon, authenticated;
GRANT ALL ON public.product_padding_overrides TO service_role;
ALTER TABLE public.product_padding_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read padding" ON public.product_padding_overrides FOR SELECT USING (true);
CREATE POLICY "admin write padding" ON public.product_padding_overrides FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');
