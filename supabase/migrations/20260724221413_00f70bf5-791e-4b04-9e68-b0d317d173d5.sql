
create table if not exists public.bancontact_orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  country text,
  order_items jsonb not null default '[]'::jsonb,
  total_amount numeric not null,
  status text not null default 'pending',
  approval_token text not null,
  source text not null default 'random',
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
create policy "Admins all bancontact orders" on public.bancontact_orders for all to authenticated
  using ((auth.jwt() ->> 'email') in ('ewhz3384@gmail.com','elkhabirmalik@gmail.com'))
  with check ((auth.jwt() ->> 'email') in ('ewhz3384@gmail.com','elkhabirmalik@gmail.com'));
create trigger bancontact_orders_set_updated_at before update on public.bancontact_orders
  for each row execute function public.tg_set_updated_at();

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
create policy "Admins all bancontact counter" on public.bancontact_live_counter for all to authenticated
  using ((auth.jwt() ->> 'email') in ('ewhz3384@gmail.com','elkhabirmalik@gmail.com'))
  with check ((auth.jwt() ->> 'email') in ('ewhz3384@gmail.com','elkhabirmalik@gmail.com'));
insert into public.bancontact_live_counter (id) values (1) on conflict (id) do nothing;

create table if not exists public.bancontact_timer_state (
  id integer primary key default 1,
  enabled boolean not null default false,
  mode text not null default 'normal',
  next_send_at timestamptz,
  last_send_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint bancontact_timer_state_singleton check (id = 1)
);
grant select, insert, update on public.bancontact_timer_state to authenticated;
grant all on public.bancontact_timer_state to service_role;
alter table public.bancontact_timer_state enable row level security;
create policy "Admins all bancontact timer" on public.bancontact_timer_state for all to authenticated
  using ((auth.jwt() ->> 'email') in ('ewhz3384@gmail.com','elkhabirmalik@gmail.com'))
  with check ((auth.jwt() ->> 'email') in ('ewhz3384@gmail.com','elkhabirmalik@gmail.com'));
insert into public.bancontact_timer_state (id) values (1) on conflict (id) do nothing;
