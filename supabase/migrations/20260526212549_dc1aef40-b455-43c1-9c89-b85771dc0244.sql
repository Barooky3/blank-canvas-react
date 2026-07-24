CREATE TABLE public.product_attributes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL UNIQUE,
  season SMALLINT NOT NULL DEFAULT 50,
  longevity SMALLINT NOT NULL DEFAULT 50,
  gender_tendency SMALLINT NOT NULL DEFAULT 50,
  uniqueness SMALLINT NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_attributes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_attributes TO authenticated;
GRANT ALL ON public.product_attributes TO service_role;

ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product attributes"
ON public.product_attributes FOR SELECT
USING (true);

CREATE POLICY "Only primary admin can insert product attributes"
ON public.product_attributes FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

CREATE POLICY "Only primary admin can update product attributes"
ON public.product_attributes FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

CREATE POLICY "Only primary admin can delete product attributes"
ON public.product_attributes FOR DELETE
TO authenticated
USING ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

CREATE TRIGGER update_product_attributes_updated_at
BEFORE UPDATE ON public.product_attributes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();