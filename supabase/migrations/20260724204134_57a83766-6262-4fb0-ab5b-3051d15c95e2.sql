CREATE POLICY "No direct client access to signup verification codes"
ON public.email_otps
FOR ALL
USING (false)
WITH CHECK (false);