
CREATE TABLE IF NOT EXISTS public.product_attributes (
  product_id text PRIMARY KEY,
  season smallint NOT NULL DEFAULT 50,
  longevity smallint NOT NULL DEFAULT 50,
  gender_tendency smallint NOT NULL DEFAULT 50,
  uniqueness smallint NOT NULL DEFAULT 50,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_attributes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_attributes TO authenticated;
GRANT ALL ON public.product_attributes TO service_role;

ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read attrs" ON public.product_attributes;
CREATE POLICY "public read attrs" ON public.product_attributes FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin write attrs" ON public.product_attributes;
CREATE POLICY "admin write attrs" ON public.product_attributes FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

INSERT INTO public.product_attributes (product_id, season, longevity, gender_tendency, uniqueness) VALUES
('evening-sweetheart-bundle',60,75,60,40),
('young-playboy-bundle',55,75,20,40),
('sleek-and-clean-bundle',30,60,30,40),
('jpg-bundle',55,80,20,40),
('amore-caffe',70,80,60,75),
('althair',75,85,25,80),
('aoud-lemon-mint',25,75,40,75),
('aoud-vanille',80,85,55,75),
('aventus',45,80,15,70),
('aventus-absolu',55,90,15,75),
('1-million-elixir',60,80,15,25),
('black-orchid',80,85,55,45),
('born-in-roma-intense',55,75,25,25),
('born-in-roma-green-stravaganza',35,70,30,25),
('born-in-roma',45,70,25,25),
('cedrat-boise',35,80,20,75),
('delina',60,85,90,80),
('erba-gold',35,80,60,85),
('erba-pura',40,80,55,85),
('eros-energy',30,70,20,20),
('eros-flame',60,75,15,20),
('eros-parfum',65,80,15,20),
('prada-paradoxe',60,75,85,30),
('french-riviera',25,75,45,75),
('homme-intense',65,80,20,30),
('imagination',40,80,25,75),
('lv-afternoon-swim',15,60,50,70),
('khamrah-parfum',75,85,55,20),
('khamrah-qahwa',75,85,55,20),
('layton',60,90,20,80),
('stronger-with-you-intensely',65,85,20,25),
('le-beau-le-parfum',55,80,20,25),
('le-beau-paradise-garden',30,70,25,25),
('spicebomb-extreme',70,85,15,30),
('born-in-roma-coral-fantasy',30,70,25,25),
('1-million-parfum',65,80,15,25),
('le-male-elixir',65,85,20,25),
('the-most-wanted-parfum',55,85,20,25),
('black-opium',65,85,90,25),
('le-male-le-parfum',60,80,20,25),
('le-beau-edt',30,60,25,25),
('le-male-elixir-absolu',65,90,20,30),
('libre',55,80,85,25),
('mon-paris',55,75,90,25),
('myself-edp',45,75,25,25),
('phantom-parfum',45,75,20,25),
('ysl-y-edp',45,75,20,25),
('naxos',65,85,25,85),
('xerjoff-torino-21',55,80,50,85),
('tom-ford-neroli-portofino',15,60,50,70),
('tom-ford-tobacco-vanille',90,90,45,70),
('pacific-chill',20,70,50,70),
('paradigme',45,75,25,30),
('red-tobacco',75,85,30,75),
('sauvage-parfum',55,85,15,25),
('silver-mountain-water',25,70,40,70),
('stronger-with-you-amber',70,85,20,25),
('stronger-with-you-absolutely',70,85,20,25),
('stronger-with-you-parfum',65,85,20,25),
('symphony',55,85,50,75),
('the-most-wanted-edp-intense',55,85,20,25),
('tonka-cola',70,85,40,75),
('xplicit-vanilla',75,85,60,75),
('bad-boy-cobalt',55,75,20,25),
('initio-side-effect',75,90,50,90),
('creed-virgin-island-water',10,60,45,70),
('shl-god-of-fire',80,90,25,90),
('lv-ombre-nomade',85,95,50,80),
('invictus-victory-elixir',55,80,15,25),
('baccarat-rouge-540-extrait',60,95,50,80),
('ex-nihilo-blue-talisman',50,80,45,85),
('lv-city-of-stars',50,80,50,75)
ON CONFLICT (product_id) DO UPDATE SET
  season = EXCLUDED.season,
  longevity = EXCLUDED.longevity,
  gender_tendency = EXCLUDED.gender_tendency,
  uniqueness = EXCLUDED.uniqueness,
  updated_at = now();
