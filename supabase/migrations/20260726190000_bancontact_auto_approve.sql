-- Instantly credit generated Bancontact orders to the live tally.
--
-- Previously, bancontact-generate inserted orders as status = 'pending' and
-- they were only credited after a manual Approve click or the delayed
-- bancontact-timer-tick auto-approval (1-5 min). This trigger removes that gap:
-- any bancontact order that would be inserted as 'pending' is flipped to
-- 'approved' with approved_at = now() at insert time.
--
-- The existing AFTER-INSERT trigger (bancontact_orders_refresh_counter) then
-- recalculates bancontact_live_counter immediately, so seed / history / timed /
-- custom orders are redeemed to the total instantly with no manual step.
--
-- Orders explicitly inserted with another status (e.g. 'approved' straight from
-- an updated edge function, or a future 'split') are left untouched.

create or replace function public.auto_approve_bancontact_order()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if NEW.status is null or NEW.status = 'pending' then
    NEW.status := 'approved';
    if NEW.approved_at is null then
      NEW.approved_at := now();
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists bancontact_orders_auto_approve on public.bancontact_orders;

create trigger bancontact_orders_auto_approve
  before insert on public.bancontact_orders
  for each row execute function public.auto_approve_bancontact_order();
