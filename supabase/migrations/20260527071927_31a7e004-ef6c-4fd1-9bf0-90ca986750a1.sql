CREATE POLICY "Users can update own reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND is_admin_added = false)
WITH CHECK (auth.uid() = user_id AND is_admin_added = false AND status = 'pending');

CREATE POLICY "Users can delete own reviews"
ON public.reviews
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND is_admin_added = false);