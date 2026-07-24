import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns true when the currently signed-in user's email is in banned_users.
 * RLS only returns the row when lower(email) = lower(auth.email()), so a row = banned.
 */
export const useBannedStatus = () => {
  const { user } = useAuth();
  const [isBanned, setIsBanned] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user?.email) {
      setIsBanned(false);
      setChecked(true);
      return;
    }
    setChecked(false);
    supabase
      .from('banned_users')
      .select('email')
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setIsBanned(!!data);
        setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  return { isBanned, checked };
};
