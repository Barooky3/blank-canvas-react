
-- 1. Remove anonymous upload policy on product-images
DROP POLICY IF EXISTS "Allow public uploads to product-images" ON storage.objects;

-- 2. Lock down realtime.messages (no client may subscribe)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deny all realtime subscriptions" ON realtime.messages;
CREATE POLICY "Deny all realtime subscriptions"
ON realtime.messages
AS PERMISSIVE
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- 3. Explicit deny-all policies on orders (service role bypasses RLS)
DROP POLICY IF EXISTS "Deny all client access to orders" ON public.orders;
CREATE POLICY "Deny all client access to orders"
ON public.orders
AS PERMISSIVE
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- 4. Explicit deny-all on visitor_sessions
DROP POLICY IF EXISTS "Deny all client access to visitor_sessions" ON public.visitor_sessions;
CREATE POLICY "Deny all client access to visitor_sessions"
ON public.visitor_sessions
AS PERMISSIVE
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- 5. Revoke EXECUTE on SECURITY DEFINER trigger function from client roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
