-- Restrict access to raw poll_votes rows (which expose voter_fingerprint)
-- and provide an aggregate-only RPC for public consumption.

DROP POLICY IF EXISTS "Anyone can view poll votes" ON public.poll_votes;

REVOKE SELECT ON public.poll_votes FROM anon;
REVOKE SELECT ON public.poll_votes FROM authenticated;

CREATE OR REPLACE FUNCTION public.get_poll_counts(_poll_id text)
RETURNS TABLE(choice text, vote_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT choice, COUNT(*)::bigint AS vote_count
  FROM public.poll_votes
  WHERE poll_id = _poll_id
  GROUP BY choice;
$$;

GRANT EXECUTE ON FUNCTION public.get_poll_counts(text) TO anon, authenticated;