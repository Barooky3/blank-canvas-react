CREATE TABLE public.product_description_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id text NOT NULL UNIQUE,
  description text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_description_overrides TO anon;
GRANT SELECT ON public.product_description_overrides TO authenticated;
GRANT ALL ON public.product_description_overrides TO service_role;

ALTER TABLE public.product_description_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product description overrides"
ON public.product_description_overrides FOR SELECT USING (true);

CREATE POLICY "Only primary admin can insert product description overrides"
ON public.product_description_overrides FOR INSERT TO authenticated
WITH CHECK ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

CREATE POLICY "Only primary admin can update product description overrides"
ON public.product_description_overrides FOR UPDATE TO authenticated
USING ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

CREATE POLICY "Only primary admin can delete product description overrides"
ON public.product_description_overrides FOR DELETE TO authenticated
USING ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

CREATE TRIGGER update_product_description_overrides_updated_at
BEFORE UPDATE ON public.product_description_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();