-- Add a "very_aggressive" Bancontact timer mode (5–15 min), sitting between
-- hyper_aggressive (1–5 min) and aggressive (10–20 min).
--
-- The DB-native timer (public.bancontact_timed_tick) reschedules next_send_at
-- from a CASE on the current mode, so the new mode must be added there or it
-- would silently fall through to the 'normal' (40–60 min) default. This only
-- changes that CASE; the rest of the function is unchanged from
-- 20260727150000_bancontact_db_native_timer.sql.

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
      when 'very_aggressive'  then v_min := 5;  v_max := 15;
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
