
-- 1. Drop customer_email from reviews (was publicly readable via approved-reviews policy)
ALTER TABLE public.reviews DROP COLUMN IF EXISTS customer_email;

-- 2. Tracking lookups: restrict writes to service_role only
REVOKE INSERT, UPDATE, DELETE ON public.tracking_lookups FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.tracking_lookups TO service_role;

-- Add explicit restrictive deny policies (defense in depth)
DROP POLICY IF EXISTS "Block client inserts on tracking_lookups" ON public.tracking_lookups;
CREATE POLICY "Block client inserts on tracking_lookups"
  ON public.tracking_lookups AS RESTRICTIVE FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "Block client updates on tracking_lookups" ON public.tracking_lookups;
CREATE POLICY "Block client updates on tracking_lookups"
  ON public.tracking_lookups AS RESTRICTIVE FOR UPDATE
  TO anon, authenticated
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Block client deletes on tracking_lookups" ON public.tracking_lookups;
CREATE POLICY "Block client deletes on tracking_lookups"
  ON public.tracking_lookups AS RESTRICTIVE FOR DELETE
  TO anon, authenticated
  USING (false);
