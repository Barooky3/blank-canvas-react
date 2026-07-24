
DROP POLICY "Anyone can check bans" ON public.banned_users;

CREATE POLICY "Users can check own ban status" ON public.banned_users
  FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.email()));
