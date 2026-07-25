-- Repair for the 5 migrations that could not run verbatim on the new project.
-- Skips realtime.messages statements (owned by a system role) and redundant
-- objects that later migrations already established. Fully idempotent.

-- === Storage object policies (20260526195900 & 20260601141150) ===
DROP POLICY IF EXISTS "Allow public uploads to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;

DROP POLICY IF EXISTS "Only admin can upload product images" ON storage.objects;
CREATE POLICY "Only admin can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND (auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

DROP POLICY IF EXISTS "Only admin can update product images" ON storage.objects;
CREATE POLICY "Only admin can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND (auth.jwt() ->> 'email') = 'ewhz3384@gmail.com')
WITH CHECK (bucket_id = 'product-images' AND (auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

DROP POLICY IF EXISTS "Only admin can delete product images" ON storage.objects;
CREATE POLICY "Only admin can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND (auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

DROP POLICY IF EXISTS "Only admin can read payment proofs" ON storage.objects;
CREATE POLICY "Only admin can read payment proofs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-proofs' AND (auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

DROP POLICY IF EXISTS "Only admin can manage payment proofs" ON storage.objects;
CREATE POLICY "Only admin can manage payment proofs"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'payment-proofs' AND (auth.jwt() ->> 'email') = 'ewhz3384@gmail.com')
WITH CHECK (bucket_id = 'payment-proofs' AND (auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

-- === orders policies (20260526195900 deny + 20260724220811 access) ===
DROP POLICY IF EXISTS "Deny all client access to orders" ON public.orders;
CREATE POLICY "Deny all client access to orders" ON public.orders
AS PERMISSIVE FOR ALL TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "orders_insert_any" ON public.orders;
CREATE POLICY "orders_insert_any" ON public.orders
FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
CREATE POLICY "orders_admin_all" ON public.orders
FOR ALL TO authenticated
USING ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;

-- orders sequence grant (name may vary; ignore if absent)
DO $$
DECLARE seqname text;
BEGIN
  SELECT pg_get_serial_sequence('public.orders', 'order_number') INTO seqname;
  IF seqname IS NOT NULL THEN
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %s TO anon, authenticated, service_role', seqname);
  END IF;
END $$;

-- === visitor_sessions deny (20260526195900) ===
DROP POLICY IF EXISTS "Deny all client access to visitor_sessions" ON public.visitor_sessions;
CREATE POLICY "Deny all client access to visitor_sessions" ON public.visitor_sessions
AS PERMISSIVE FOR ALL TO public USING (false) WITH CHECK (false);

-- === Lock down SECURITY DEFINER trigger fn (20260526195900) ===
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
