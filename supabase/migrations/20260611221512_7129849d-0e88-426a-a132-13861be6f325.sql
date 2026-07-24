
revoke execute on function public.bancontact_counter_calculated_values(timestamptz) from public, anon, authenticated;
revoke execute on function public.recalculate_bancontact_live_counter_before_save() from public, anon, authenticated;
revoke execute on function public.refresh_bancontact_counter_after_order_change() from public, anon, authenticated;
grant execute on function public.bancontact_counter_calculated_values(timestamptz) to service_role;
grant execute on function public.recalculate_bancontact_live_counter_before_save() to service_role;
grant execute on function public.refresh_bancontact_counter_after_order_change() to service_role;
