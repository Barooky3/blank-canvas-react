CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id text NOT NULL,
  choice text NOT NULL,
  voter_fingerprint text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(poll_id, voter_fingerprint)
);

CREATE INDEX idx_poll_votes_poll_id ON public.poll_votes(poll_id);

GRANT SELECT, INSERT ON public.poll_votes TO anon;
GRANT SELECT, INSERT ON public.poll_votes TO authenticated;
GRANT ALL ON public.poll_votes TO service_role;

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view poll votes"
ON public.poll_votes
FOR SELECT
USING (true);

CREATE POLICY "Anyone can cast a poll vote"
ON public.poll_votes
FOR INSERT
WITH CHECK (true);