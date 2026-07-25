import { Client } from "pg";

let conn = process.env.POSTGRES_URL_NON_POOLING.replace(/([?&])(sslmode|ssl)=[^&]*/g, "$1").replace(/[?&]$/, "");
const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
await client.connect();

const tables = ["orders", "banned_users", "product_padding_overrides", "bancontact_orders", "bancontact_live_counter", "bancontact_timer_state", "email_otps", "profiles"];
const t = await client.query(
  `select table_name from information_schema.tables where table_schema='public' and table_name = any($1)`,
  [tables]
);
console.log("EXISTING TABLES:", t.rows.map((r) => r.table_name).sort());
console.log("MISSING TABLES:", tables.filter((x) => !t.rows.find((r) => r.table_name === x)));

const fn = await client.query(
  `select proname from pg_proc where proname in ('tg_set_updated_at','handle_new_user')`
);
console.log("FUNCTIONS:", fn.rows.map((r) => r.proname));

const trig = await client.query(
  `select tgname, c.relname from pg_trigger tg join pg_class c on c.oid=tg.tgrelid where not tg.tgisinternal and c.relname in ('orders','bancontact_orders')`
);
console.log("TRIGGERS:", trig.rows);

const pol = await client.query(
  `select tablename, policyname from pg_policies where schemaname='public' and tablename in ('orders','banned_users','product_padding_overrides','bancontact_orders','bancontact_live_counter','bancontact_timer_state')`
);
console.log("POLICIES:", pol.rows);

await client.end();
