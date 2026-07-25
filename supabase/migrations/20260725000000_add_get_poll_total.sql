-- Returns ONLY the total number of votes for a poll (no per-choice breakdown).
-- This lets the homepage decide whether the reveal threshold (50 votes) is met
-- without exposing the actual results to non-admins before the threshold.

CREATE OR REPLACE FUNCTION public.get_poll_total(_poll_id text)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint
  FROM public.poll_votes
  WHERE poll_id = _poll_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_poll_total(text) TO anon, authenticated;
