const { Client } = require("/tmp/node_modules/pg");

const stmts = [
  // 1. Shared updated_at trigger function (was rolled back)
  `CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
     RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
     BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;`,
  // 2. Attach updated_at triggers (idempotent)
  `DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;`,
  `CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON public.orders
     FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();`,
  `DROP TRIGGER IF EXISTS bancontact_orders_set_updated_at ON public.bancontact_orders;`,
  `CREATE TRIGGER bancontact_orders_set_updated_at BEFORE UPDATE ON public.bancontact_orders
     FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();`,
  // 3. Deny-all hardening policies that rolled back
  `DROP POLICY IF EXISTS "Deny all client access to orders" ON public.orders;`,
  `CREATE POLICY "Deny all client access to orders" ON public.orders
     AS PERMISSIVE FOR ALL TO public USING (false) WITH CHECK (false);`,
  `DROP POLICY IF EXISTS "Deny all client access to visitor_sessions" ON public.visitor_sessions;`,
  `CREATE POLICY "Deny all client access to visitor_sessions" ON public.visitor_sessions
     AS PERMISSIVE FOR ALL TO public USING (false) WITH CHECK (false);`,
  // 4. Revoke execute on SECURITY DEFINER trigger fn (if present)
  `REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;`,
  // 5. realtime.messages lockdown (may require owner; tolerated)
  `ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;`,
  `DROP POLICY IF EXISTS "Deny all realtime subscriptions" ON realtime.messages;`,
  `CREATE POLICY "Deny all realtime subscriptions" ON realtime.messages
     AS PERMISSIVE FOR ALL TO public USING (false) WITH CHECK (false);`,
];

(async () => {
  const c = new Client({ host:"aws-1-eu-west-1.pooler.supabase.com", port:5432, user:"postgres.whoijmulomzwvsjomret", password:"Mubarak2344###", database:"postgres", ssl:{rejectUnauthorized:false}, statement_timeout:60000 });
  await c.connect();
  let ok=0, fail=0;
  for (const s of stmts) {
    const label = s.replace(/\s+/g," ").slice(0,70);
    try { await c.query(s); ok++; console.log("[v0] OK   "+label); }
    catch(e){ fail++; console.log("[v0] SKIP "+label+"  -> "+e.message); }
  }
  // Verify trigger fn now exists
  const fn = (await c.query("select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='tg_set_updated_at'")).rowCount;
  console.log(`\n[v0] repair done: ${ok} ok, ${fail} skipped. tg_set_updated_at exists? ${fn?"YES":"NO"}`);
  await c.end();
})().catch(e=>console.log("[v0] FATAL", e.message));
