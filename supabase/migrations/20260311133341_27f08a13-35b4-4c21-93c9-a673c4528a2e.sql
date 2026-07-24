
-- Allow service role to delete (unban). No public delete policy needed since edge function uses service role.
-- But we need to ensure the service role can bypass RLS, which it does by default.
-- No additional policy needed.
SELECT 1;
