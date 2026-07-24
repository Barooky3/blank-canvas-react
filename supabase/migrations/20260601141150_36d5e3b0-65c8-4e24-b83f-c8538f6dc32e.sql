
-- Restrict product-images uploads to primary admin only
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;

CREATE POLICY "Only admin can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND (auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

CREATE POLICY "Only admin can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND (auth.jwt() ->> 'email') = 'ewhz3384@gmail.com')
WITH CHECK (bucket_id = 'product-images' AND (auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

CREATE POLICY "Only admin can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND (auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

-- Payment proofs: explicitly restrict ALL client access to admin only (service role bypasses RLS)
CREATE POLICY "Only admin can read payment proofs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-proofs' AND (auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

CREATE POLICY "Only admin can manage payment proofs"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'payment-proofs' AND (auth.jwt() ->> 'email') = 'ewhz3384@gmail.com')
WITH CHECK (bucket_id = 'payment-proofs' AND (auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

-- Realtime channel authorization: only admin emails can subscribe to realtime messages
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can receive realtime messages"
ON realtime.messages FOR SELECT TO authenticated
USING ((auth.jwt() ->> 'email') = ANY (ARRAY['ewhz3384@gmail.com', 'elkhabirmalik@gmail.com']));
