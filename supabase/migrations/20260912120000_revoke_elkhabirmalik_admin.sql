-- Revoke admin access for elkhabirmalik@gmail.com.
-- Rewrites every RLS policy whose USING / WITH CHECK expression still lists that
-- email, leaving ewhz3384@gmail.com as the only admin.
DO $$
DECLARE
  pol record;
  new_qual text;
  new_check text;
  stmt text;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE coalesce(qual, '') || coalesce(with_check, '') ILIKE '%elkhabirmalik@gmail.com%'
  LOOP
    new_qual := replace(replace(pol.qual,
      ', ''elkhabirmalik@gmail.com''::text', ''),
      '''elkhabirmalik@gmail.com''::text, ', '');
    new_check := replace(replace(pol.with_check,
      ', ''elkhabirmalik@gmail.com''::text', ''),
      '''elkhabirmalik@gmail.com''::text, ', '');

    stmt := format('ALTER POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    IF new_qual IS NOT NULL THEN
      stmt := stmt || ' USING (' || new_qual || ')';
    END IF;
    IF new_check IS NOT NULL THEN
      stmt := stmt || ' WITH CHECK (' || new_check || ')';
    END IF;
    EXECUTE stmt;
  END LOOP;
END $$;
