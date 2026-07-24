
-- =========================================================
-- Bancontact admin testing system
-- =========================================================

-- Extensions for scheduling
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ---------- bancontact_orders ----------
create table if not exists public.bancontact_orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  country text,
  order_items jsonb not null default '[]'::jsonb,
  total_amount numeric not null,
  status text not null default 'pending', -- pending | approved | rejected | split
  approval_token text not null,
  source text not null default 'random',  -- random | custom | timed
  approved_at timestamptz,
  rejected_at timestamptz,
  split_first_at timestamptz,
  split_second_due_at timestamptz,
  split_second_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.bancontact_orders to authenticated;
grant all on public.bancontact_orders to service_role;

alter table public.bancontact_orders enable row level security;

create policy "Admins read bancontact orders"
  on public.bancontact_orders for select
  to authenticated
  using ((auth.jwt() ->> 'email') in ('ewhz3384@gmail.com','elkhabirmalik@gmail.com'));

create policy "Admins insert bancontact orders"
  on public.bancontact_orders for insert
  to authenticated
  with check ((auth.jwt() ->> 'email') in ('ewhz3384@gmail.com','elkhabirmalik@gmail.com'));

create policy "Admins update bancontact orders"
  on public.bancontact_orders for update
  to authenticated
  using ((auth.jwt() ->> 'email') in ('ewhz3384@gmail.com','elkhabirmalik@gmail.com'));

create policy "Admins delete bancontact orders"
  on public.bancontact_orders for delete
  to authenticated
  using ((auth.jwt() ->> 'email') in ('ewhz3384@gmail.com','elkhabirmalik@gmail.com'));

create trigger bancontact_orders_set_updated_at
before update on public.bancontact_orders
for each row execute function public.update_updated_at_column();

-- ---------- bancontact_live_counter ----------
create table if not exists public.bancontact_live_counter (
  id integer primary key default 1,
  gross numeric not null default 0,
  ad_spend numeric not null default 0,
  net numeric not null default 0,
  order_count integer not null default 0,
  contributing_orders jsonb not null default '[]'::jsonb,
  reset_at timestamptz not null default '2020-01-01T00:00:00Z'::timestamptz,
  reset_history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint bancontact_live_counter_singleton check (id = 1)
);

grant select, insert, update on public.bancontact_live_counter to authenticated;
grant all on public.bancontact_live_counter to service_role;

alter table public.bancontact_live_counter enable row level security;

create policy "Admins read bancontact counter"
  on public.bancontact_live_counter for select
  to authenticated
  using ((auth.jwt() ->> 'email') in ('ewhz3384@gmail.com','elkhabirmalik@gmail.com'));

create policy "Admins write bancontact counter"
  on public.bancontact_live_counter for insert
  to authenticated
  with check ((auth.jwt() ->> 'email') in ('ewhz3384@gmail.com','elkhabirmalik@gmail.com'));

create policy "Admins update bancontact counter"
  on public.bancontact_live_counter for update
  to authenticated
  using ((auth.jwt() ->> 'email') in ('ewhz3384@gmail.com','elkhabirmalik@gmail.com'));

-- Seed singleton row
insert into public.bancontact_live_counter (id) values (1)
on conflict (id) do nothing;

-- ---------- bancontact_timer_state ----------
create table if not exists public.bancontact_timer_state (
  id integer primary key default 1,
  enabled boolean not null default false,
  mode text not null default 'normal', -- hyper_aggressive | aggressive | hard | normal | relaxed | hyper_relaxed
  next_send_at timestamptz,
  last_send_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint bancontact_timer_state_singleton check (id = 1)
);

grant select, insert, update on public.bancontact_timer_state to authenticated;
grant all on public.bancontact_timer_state to service_role;

alter table public.bancontact_timer_state enable row level security;

create policy "Admins read bancontact timer"
  on public.bancontact_timer_state for select
  to authenticated
  using ((auth.jwt() ->> 'email') in ('ewhz3384@gmail.com','elkhabirmalik@gmail.com'));

create policy "Admins write bancontact timer"
  on public.bancontact_timer_state for insert
  to authenticated
  with check ((auth.jwt() ->> 'email') in ('ewhz3384@gmail.com','elkhabirmalik@gmail.com'));

create policy "Admins update bancontact timer"
  on public.bancontact_timer_state for update
  to authenticated
  using ((auth.jwt() ->> 'email') in ('ewhz3384@gmail.com','elkhabirmalik@gmail.com'));

insert into public.bancontact_timer_state (id) values (1)
on conflict (id) do nothing;

-- ---------- Calculation function ----------
create or replace function public.bancontact_counter_calculated_values(_reset_at timestamptz)
returns table(gross numeric, order_count integer, contributing_orders jsonb)
language sql
stable
security definer
set search_path = public
as $$
  with credits as (
    select id, customer_name, customer_email, total_amount, total_amount as credit,
           approved_at as credited_at, 'full'::text as kind
    from public.bancontact_orders
    where status = 'approved' and approved_at >= _reset_at
    union all
    select id, customer_name, customer_email, total_amount, total_amount / 2.0 as credit,
           split_first_at as credited_at, 'split_1'::text as kind
    from public.bancontact_orders
    where status = 'split' and split_first_at is not null and split_first_at >= _reset_at
    union all
    select id, customer_name, customer_email, total_amount, total_amount / 2.0 as credit,
           split_second_at as credited_at, 'split_2'::text as kind
    from public.bancontact_orders
    where status = 'split' and split_second_at is not null and split_second_at >= _reset_at
  )
  select
    coalesce(sum(credit), 0)::numeric as gross,
    count(*)::integer as order_count,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'customer_name', customer_name,
          'customer_email', customer_email,
          'total_amount', total_amount,
          'credit', credit,
          'kind', kind,
          'method', 'Bancontact',
          'approvedAt', credited_at
        )
        order by credited_at desc
      ),
      '[]'::jsonb
    ) as contributing_orders
  from credits;
$$;

-- ---------- Recalculate trigger on counter save ----------
create or replace function public.recalculate_bancontact_live_counter_before_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  calculated record;
begin
  select * into calculated from public.bancontact_counter_calculated_values(NEW.reset_at);
  NEW.gross := coalesce(calculated.gross, 0);
  NEW.order_count := coalesce(calculated.order_count, 0);
  NEW.contributing_orders := coalesce(calculated.contributing_orders, '[]'::jsonb);
  NEW.net := NEW.gross - NEW.ad_spend;
  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists bancontact_counter_recalc on public.bancontact_live_counter;
create trigger bancontact_counter_recalc
before insert or update on public.bancontact_live_counter
for each row execute function public.recalculate_bancontact_live_counter_before_save();

-- ---------- Nudge counter when bancontact_orders change ----------
create or replace function public.refresh_bancontact_counter_after_order_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bancontact_live_counter
    set updated_at = now()
    where id = 1;
  return null;
end;
$$;

drop trigger if exists bancontact_orders_refresh_counter on public.bancontact_orders;
create trigger bancontact_orders_refresh_counter
after insert or update or delete on public.bancontact_orders
for each row execute function public.refresh_bancontact_counter_after_order_change();

-- Trigger an initial recompute
update public.bancontact_live_counter set updated_at = now() where id = 1;

-- ---------- Schedule per-minute tick ----------
-- Removes any previous schedule with the same name, then schedules fresh
do $$
begin
  perform cron.unschedule('bancontact-timer-tick');
exception when others then null;
end$$;

select cron.schedule(
  'bancontact-timer-tick',
  '* * * * *',
  $cron$
  select net.http_post(
    url := 'https://wiyptlcujvbonznoeint.supabase.co/functions/v1/bancontact-timer-tick',
    headers := '{"Content-Type":"application/json","apikey":"sb_publishable_lWzajf3B8BoU059yqHiKZw_5M_DFzae"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $cron$
);
