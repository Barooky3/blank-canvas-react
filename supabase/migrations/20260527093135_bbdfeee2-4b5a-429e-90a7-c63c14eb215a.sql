
CREATE TABLE public.review_order (
  id integer PRIMARY KEY DEFAULT 1,
  order_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT review_order_singleton CHECK (id = 1)
);

GRANT SELECT ON public.review_order TO anon, authenticated;
GRANT ALL ON public.review_order TO service_role;

ALTER TABLE public.review_order ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review order"
ON public.review_order FOR SELECT
USING (true);

CREATE POLICY "Admin can insert review order"
ON public.review_order FOR INSERT TO authenticated
WITH CHECK ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

CREATE POLICY "Admin can update review order"
ON public.review_order FOR UPDATE TO authenticated
USING ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

INSERT INTO public.review_order (id, order_ids) VALUES (1, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;
