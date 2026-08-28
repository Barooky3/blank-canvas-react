-- Reviews recovered from the ORIGINAL Supabase project (ref: kolnekutwubdwqpgzaob)
-- Exported read-only via the anon REST API on 2026-08-28.
-- The old project's public.reviews table contained only these 2 rows (both live test
-- submissions). No other real/edited reviews existed in the old database.
-- These are also mirrored into the static review pool in src/data/homeReviews.ts (r42, r43).
--
-- Idempotent: safe to run against the current project's public.reviews table.

INSERT INTO public.reviews
  (id, user_id, customer_name, rating, text, status, is_admin_added, created_at, updated_at, images)
VALUES
  ('21755243-6a5f-4eec-9f52-66d05d9f04a0', '6474ee54-2c27-447b-a833-cb7264e2d6a3', 'Victor', 5,
   'Hi, I''m just putting this here to test if the reviews are legit.', 'approved', false,
   '2026-08-07T08:16:03.011385+00:00', '2026-08-08T00:56:23.223009+00:00', '[]'::jsonb),
  ('81709763-2eab-4a2e-b13e-a80ac68c0130', '16214e63-4867-46cd-9ba6-2b5e4ebf83c0', 'Dovkka', 4,
   'Just Checking if i can write rewiews', 'approved', false,
   '2026-08-16T16:20:12.455318+00:00', '2026-08-16T22:52:18.53391+00:00', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  customer_name = EXCLUDED.customer_name, rating = EXCLUDED.rating, text = EXCLUDED.text,
  status = EXCLUDED.status, is_admin_added = EXCLUDED.is_admin_added,
  updated_at = EXCLUDED.updated_at, images = EXCLUDED.images;
