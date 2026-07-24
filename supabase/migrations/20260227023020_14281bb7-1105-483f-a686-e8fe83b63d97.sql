
CREATE TABLE public.product_padding_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL UNIQUE,
  padding_top numeric NOT NULL DEFAULT 0,
  padding_right numeric NOT NULL DEFAULT 0,
  padding_bottom numeric NOT NULL DEFAULT 0,
  padding_left numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_padding_overrides ENABLE ROW LEVEL SECURITY;

-- Anyone can read padding overrides (needed for rendering product cards)
CREATE POLICY "Anyone can read padding overrides"
ON public.product_padding_overrides
FOR SELECT
USING (true);

-- Only authenticated users can insert (admin check done in app)
CREATE POLICY "Authenticated users can insert padding overrides"
ON public.product_padding_overrides
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only authenticated users can update
CREATE POLICY "Authenticated users can update padding overrides"
ON public.product_padding_overrides
FOR UPDATE
TO authenticated
USING (true);
