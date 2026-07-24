
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved')),
  is_admin_added BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can read approved reviews
CREATE POLICY "Anyone can view approved reviews"
ON public.reviews FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- Logged in users can see their own pending reviews
CREATE POLICY "Users can view own pending reviews"
ON public.reviews FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Primary admin can view all reviews
CREATE POLICY "Admin can view all reviews"
ON public.reviews FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

-- Logged in users can insert their own review (always pending, never admin_added)
CREATE POLICY "Users can submit own reviews"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND is_admin_added = false
);

-- Admin can insert reviews (any status, any user_id, including admin_added=true)
CREATE POLICY "Admin can insert any review"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

-- Admin only: update + delete
CREATE POLICY "Admin can update any review"
ON public.reviews FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

CREATE POLICY "Admin can delete any review"
ON public.reviews FOR DELETE
TO authenticated
USING ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

-- Auto-update updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_reviews_status_created ON public.reviews (status, created_at DESC);
CREATE INDEX idx_reviews_user_id ON public.reviews (user_id);
