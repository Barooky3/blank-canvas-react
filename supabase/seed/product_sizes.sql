-- Product image size (scale) overrides — snapshot recorded 2026-08-27
-- Source: public.product_padding_overrides on project whoijmulomzwvsjomret
-- 20 rows. All padding_* values are 0; only `scale` varies.
--
-- Idempotent: re-running upserts the recorded scale for each product.
-- Apply with: psql "$DATABASE_URL" -f supabase/seed/product_sizes.sql
-- (or paste into the Supabase SQL editor).

INSERT INTO public.product_padding_overrides
  (product_id, padding_top, padding_right, padding_bottom, padding_left, scale)
VALUES
  ('aventus-absolu',                         0, 0, 0, 0, 0.7),
  ('baccarat-rouge-540-extrait',             0, 0, 0, 0, 0.6),
  ('bad-boy-cobalt',                         0, 0, 0, 0, 0.6),
  ('creed-virgin-island-water',              0, 0, 0, 0, 0.6),
  ('ex-nihilo-blue-talisman',                0, 0, 0, 0, 0.6),
  ('ex-nihilo-blue-talisman::new-arrivals',  0, 0, 0, 0, 0.6),
  ('initio-side-effect',                     0, 0, 0, 0, 0.6),
  ('invictus-victory-elixir',                0, 0, 0, 0, 0.6),
  ('invictus-victory-elixir::new-arrivals',  0, 0, 0, 0, 0.6),
  ('layton',                                 0, 0, 0, 0, 0.65),
  ('le-beau-paradise-garden',                0, 0, 0, 0, 0.65),
  ('lv-afternoon-swim',                      0, 0, 0, 0, 0.6),
  ('lv-city-of-stars',                       0, 0, 0, 0, 0.6),
  ('lv-city-of-stars::new-arrivals',         0, 0, 0, 0, 0.6),
  ('lv-ombre-nomade',                        0, 0, 0, 0, 0.6),
  ('shl-god-of-fire',                        0, 0, 0, 0, 0.7),
  ('tom-ford-neroli-portofino',              0, 0, 0, 0, 0.6),
  ('tom-ford-tobacco-vanille',               0, 0, 0, 0, 0.6),
  ('xerjoff-torino-21',                      0, 0, 0, 0, 0.6),
  ('ysl-y-edp',                              0, 0, 0, 0, 0.6)
ON CONFLICT (product_id) DO UPDATE SET
  padding_top    = EXCLUDED.padding_top,
  padding_right  = EXCLUDED.padding_right,
  padding_bottom = EXCLUDED.padding_bottom,
  padding_left   = EXCLUDED.padding_left,
  scale          = EXCLUDED.scale,
  updated_at     = now();
