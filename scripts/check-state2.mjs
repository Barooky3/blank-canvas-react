import { Client } from "pg";

let conn = process.env.POSTGRES_URL_NON_POOLING.replace(/([?&])(sslmode|ssl)=[^&]*/g, "$1").replace(/[?&]$/, "");
const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
await client.connect();

const funcs = await client.query(
  `select n.nspname as schema, p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname ilike '%updated_at%' or p.proname ilike '%set_updated%'`
);
console.log("UPDATED_AT FUNCS:", funcs.rows);

// what function each trigger calls
const trigFns = await client.query(`
  select tg.tgname, c.relname, p.proname as func
  from pg_trigger tg
  join pg_class c on c.oid = tg.tgrelid
  join pg_proc p on p.oid = tg.tgfoid
  where not tg.tgisinternal and c.relname in ('orders','bancontact_orders')
`);
console.log("TRIGGER->FUNC:", trigFns.rows);

for (const tbl of ["orders", "visitor_sessions"]) {
  const p = await client.query(`select policyname, cmd, roles from pg_policies where schemaname='public' and tablename=$1`, [tbl]);
  const rls = await client.query(`select relrowsecurity from pg_class where relname=$1 and relnamespace='public'::regnamespace`, [tbl]);
  console.log(`\n${tbl}: RLS=${rls.rows[0]?.relrowsecurity}, policies=`, p.rows);
}

const storage = await client.query(`select policyname, cmd from pg_policies where schemaname='storage' and tablename='objects' order by policyname`);
console.log("\nSTORAGE.OBJECTS POLICIES:", storage.rows.map((r) => r.policyname));

await client.end();
