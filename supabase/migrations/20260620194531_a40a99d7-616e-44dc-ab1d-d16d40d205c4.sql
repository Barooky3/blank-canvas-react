
-- Restrict review_order SELECT to primary admin (hide seed overrides / hidden seeds from public)
DROP POLICY IF EXISTS "Anyone can view review order" ON public.review_order;

CREATE POLICY "Only primary admin can view review order"
ON public.review_order
FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'email'::text) = 'ewhz3384@gmail.com'::text);

-- Add admin-only write policies for product_padding_overrides
CREATE POLICY "Only primary admin can insert padding overrides"
ON public.product_padding_overrides
FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'email'::text) = 'ewhz3384@gmail.com'::text);

CREATE POLICY "Only primary admin can update padding overrides"
ON public.product_padding_overrides
FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'email'::text) = 'ewhz3384@gmail.com'::text)
WITH CHECK ((auth.jwt() ->> 'email'::text) = 'ewhz3384@gmail.com'::text);

CREATE POLICY "Only primary admin can delete padding overrides"
ON public.product_padding_overrides
FOR DELETE
TO authenticated
USING ((auth.jwt() ->> 'email'::text) = 'ewhz3384@gmail.com'::text);
