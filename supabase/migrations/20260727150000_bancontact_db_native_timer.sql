-- Bancontact timed generator — DB-native.
--
-- Why: the previous mechanism relied on pg_cron -> net.http_post ->
-- edge function `bancontact-timer-tick`. On this project pg_net cannot resolve
-- the project's own *.supabase.co hostname ("Couldn't resolve host name"), so
-- the cron call never actually reached the function and no timed orders were
-- ever generated (last_send_at stayed null for ~20h while enabled).
--
-- Fix: replicate the timed generator entirely in SQL and schedule it with
-- pg_cron calling the function DIRECTLY (no HTTP, no DNS). This is immune to
-- edge-function deploy state and network egress issues.
--
-- Behavior per tick (runs every minute):
--   1. Pay out any split-second halves whose split_second_due_at has passed.
--   2. If the timer is enabled and next_send_at has passed: generate exactly
--      ONE order (cloned from a random real historical order so the customer /
--      item / amount distribution matches the seed pool), then reschedule
--      next_send_at using a random delay within the current mode's range.
--
-- Newly inserted orders are auto-approved (via bancontact_orders_auto_approve)
-- and instantly credited to bancontact_live_counter (via the counter refresh
-- trigger), so each generated order is "redeemed" the moment it is created.

create or replace function public.bancontact_timed_tick()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_state record;
  v_src record;
  v_min numeric;
  v_max numeric;
  v_delay_min numeric;
  v_split_paid int := 0;
  v_generated boolean := false;
  v_new_id uuid;
begin
  -- 1) Pay out due split second-halves (parity with the old edge tick).
  update bancontact_orders
     set split_second_at = v_now,
         updated_at = v_now
   where status = 'split'
     and split_second_at is null
     and split_second_due_at is not null
     and split_second_due_at <= v_now;
  get diagnostics v_split_paid = row_count;
  if v_split_paid > 0 then
    update bancontact_live_counter set updated_at = v_now where id = 1;
  end if;

  -- 2) Timed generator
  select * into v_state from bancontact_timer_state where id = 1;

  if v_state.enabled is true
     and (v_state.next_send_at is null or v_state.next_send_at <= v_now) then

    -- Clone one random real historical order (prefer non-timed originals so
    -- the timed stream doesn't amplify its own clones; fall back to any).
    select customer_name, customer_email, country, order_items, total_amount
      into v_src
      from bancontact_orders
     where order_items is not null
       and jsonb_array_length(order_items) > 0
       and source <> 'timed'
     order by random()
     limit 1;

    if v_src is null then
      select customer_name, customer_email, country, order_items, total_amount
        into v_src
        from bancontact_orders
       where order_items is not null
         and jsonb_array_length(order_items) > 0
       order by random()
       limit 1;
    end if;

    if v_src is not null then
      insert into bancontact_orders (
        customer_name, customer_email, country, order_items, total_amount,
        status, approved_at, approval_token, source
      ) values (
        v_src.customer_name, v_src.customer_email, v_src.country,
        v_src.order_items, v_src.total_amount,
        'approved', v_now,
        replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
        'timed'
      )
      returning id into v_new_id;
      v_generated := true;
    end if;

    -- Reschedule next_send_at with a random delay in the mode's minute range.
    case coalesce(v_state.mode, 'normal')
      when 'hyper_aggressive' then v_min := 1;  v_max := 5;
      when 'aggressive'       then v_min := 10; v_max := 20;
      when 'hard'             then v_min := 20; v_max := 45;
      when 'normal'           then v_min := 40; v_max := 60;
      when 'relaxed'          then v_min := 65; v_max := 90;
      when 'hyper_relaxed'    then v_min := 95; v_max := 120;
      else v_min := 40; v_max := 60;
    end case;
    v_delay_min := v_min + random() * (v_max - v_min);

    update bancontact_timer_state
       set last_send_at = case when v_generated then v_now else last_send_at end,
           next_send_at = v_now + make_interval(secs => (v_delay_min * 60)::int),
           updated_at = v_now
     where id = 1;
  end if;

  return jsonb_build_object(
    'at', v_now,
    'generated', v_generated,
    'order_id', v_new_id,
    'split_paid', v_split_paid
  );
end;
$$;

-- Replace the broken HTTP cron job with a direct SQL call every minute.
do $$
declare
  v_jobid int;
begin
  -- Remove any existing bancontact tick jobs (the old net.http_post one and
  -- any prior version of this SQL job) so we don't double-fire.
  for v_jobid in
    select jobid from cron.job
     where command ilike '%bancontact-timer-tick%'
        or command ilike '%bancontact_timed_tick%'
  loop
    perform cron.unschedule(v_jobid);
  end loop;

  perform cron.schedule(
    'bancontact-timed-tick-sql',
    '* * * * *',
    $cron$ select public.bancontact_timed_tick(); $cron$
  );
end $$;
