-- ORDERS
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number bigserial UNIQUE,
  checkout_reference text UNIQUE,
  customer_email text NOT NULL,
  customer_name text,
  shipping_address jsonb,
  order_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending_approval',
  approval_token text,
  email_sent boolean NOT NULL DEFAULT false,
  gift_card_code text,
  discount_code text,
  discount_percent numeric DEFAULT 0,
  first_visit_at timestamptz,
  rejection_seen boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_status_idx ON public.orders(status);
CREATE INDEX orders_customer_email_idx ON public.orders(customer_email);
CREATE INDEX orders_created_at_idx ON public.orders(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.orders TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.orders_order_number_seq TO anon, authenticated, service_role;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_insert_any" ON public.orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER orders_set_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- BANNED USERS
CREATE TABLE public.banned_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.banned_users TO anon, authenticated;
GRANT ALL ON public.banned_users TO service_role;

ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "banned_users_read_all" ON public.banned_users
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "banned_users_admin_write" ON public.banned_users
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'ewhz3384@gmail.com');