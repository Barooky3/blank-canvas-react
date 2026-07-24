
-- Revoke EXECUTE from anon/authenticated on SECURITY DEFINER functions
-- that should not be callable directly via the Data API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalculate_admin_live_counter_before_save() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_admin_live_counter_after_order_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalculate_bancontact_live_counter_before_save() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_bancontact_counter_after_order_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_live_counter_calculated_values(timestamp with time zone) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bancontact_counter_calculated_values(timestamp with time zone) FROM anon, authenticated, PUBLIC;

-- Keep get_poll_counts callable by the homepage (anon + authenticated).
GRANT EXECUTE ON FUNCTION public.get_poll_counts(text) TO anon, authenticated;
