-- Add explicit deny-all policy to email_otps to document that no client access is intended
CREATE POLICY "Deny all client access"
  ON public.email_otps
  FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);