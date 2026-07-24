ALTER TABLE public.bancontact_orders REPLICA IDENTITY FULL;
ALTER TABLE public.bancontact_live_counter REPLICA IDENTITY FULL;
ALTER TABLE public.bancontact_timer_state REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bancontact_orders;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bancontact_live_counter;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bancontact_timer_state;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;