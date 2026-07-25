import { Client } from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "supabase", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

let conn = process.env.POSTGRES_URL_NON_POOLING;
if (!conn) {
  console.error("Missing POSTGRES_URL_NON_POOLING");
  process.exit(1);
}
// Strip sslmode/ssl query params so pg uses the explicit ssl option below.
conn = conn.replace(/([?&])(sslmode|ssl)=[^&]*/g, "$1").replace(/[?&]$/, "");

const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
await client.connect();

// Track applied migrations so re-runs are idempotent.
await client.query(`
  create table if not exists public._v0_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  );
`);

const appliedRes = await client.query("select name from public._v0_migrations");
const applied = new Set(appliedRes.rows.map((r) => r.name));

let ok = 0;
let skipped = 0;
const failures = [];

for (const file of files) {
  if (applied.has(file)) {
    skipped++;
    continue;
  }
  const sql = readFileSync(join(dir, file), "utf8");
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into public._v0_migrations(name) values ($1)", [file]);
    await client.query("commit");
    ok++;
    console.log("OK   ", file);
  } catch (err) {
    await client.query("rollback");
    failures.push({ file, message: err.message });
    console.log("FAIL ", file, "->", err.message);
  }
}

console.log("\n==== SUMMARY ====");
console.log("applied:", ok, "skipped:", skipped, "failed:", failures.length);
if (failures.length) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log("-", f.file, "::", f.message);
}

await client.end();
process.exit(failures.length ? 2 : 0);
