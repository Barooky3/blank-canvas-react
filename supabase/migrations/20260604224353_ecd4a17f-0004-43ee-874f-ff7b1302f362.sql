CREATE TABLE public.product_price_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL UNIQUE,
  base_price numeric,
  original_price numeric,
  variants jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_price_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_price_overrides TO authenticated;
GRANT ALL ON public.product_price_overrides TO service_role;

ALTER TABLE public.product_price_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product price overrides"
  ON public.product_price_overrides FOR SELECT
  USING (true);

CREATE POLICY "Only primary admin can insert product price overrides"
  ON public.product_price_overrides FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

CREATE POLICY "Only primary admin can update product price overrides"
  ON public.product_price_overrides FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

CREATE POLICY "Only primary admin can delete product price overrides"
  ON public.product_price_overrides FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

CREATE TRIGGER update_product_price_overrides_updated_at
  BEFORE UPDATE ON public.product_price_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();