
-- Drop overly permissive policy
DROP POLICY "Service role full access on orders" ON public.orders;

-- No public policies needed - only service role (edge functions) access this table
-- Service role bypasses RLS automatically, so no policies needed
