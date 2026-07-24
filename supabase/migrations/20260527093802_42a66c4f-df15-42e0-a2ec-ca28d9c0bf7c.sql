
ALTER TABLE public.review_order
  ADD COLUMN IF NOT EXISTS seed_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS hidden_seeds jsonb NOT NULL DEFAULT '[]'::jsonb;
