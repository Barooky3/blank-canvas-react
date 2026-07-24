CREATE TABLE public.product_stock_overrides (
  product_id text NOT NULL PRIMARY KEY,
  in_stock boolean,
  variants jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_stock_overrides TO anon;
GRANT SELECT ON public.product_stock_overrides TO authenticated;
GRANT ALL ON public.product_stock_overrides TO service_role;

ALTER TABLE public.product_stock_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stock overrides readable by everyone"
ON public.product_stock_overrides FOR SELECT
USING (true);

CREATE POLICY "Admin can manage stock overrides"
ON public.product_stock_overrides FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

CREATE TRIGGER update_product_stock_overrides_updated_at
BEFORE UPDATE ON public.product_stock_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();