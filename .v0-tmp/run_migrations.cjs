const { Client } = require("/tmp/node_modules/pg");
const fs = require("fs");
const path = require("path");

const MIG_DIR = "/vercel/share/v0-project/supabase/migrations";

async function main() {
  const files = fs.readdirSync(MIG_DIR).filter(f => f.endsWith(".sql")).sort();
  console.log(`[v0] ${files.length} migration files found`);

  const client = new Client({
    host: "aws-1-eu-west-1.pooler.supabase.com",
    port: 5432,
    user: "postgres.whoijmulomzwvsjomret",
    password: "Mubarak2344###",
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    statement_timeout: 120000,
  });
  await client.connect();
  console.log("[v0] connected (session pooler)");

  let ok = 0;
  const failures = [];
  for (const f of files) {
    const sql = fs.readFileSync(path.join(MIG_DIR, f), "utf8");
    if (!sql.trim()) { ok++; continue; }
    try {
      await client.query(sql);
      ok++;
      console.log(`[v0] OK   ${f}`);
    } catch (e) {
      console.log(`[v0] FAIL ${f}: ${e.message}`);
      failures.push({ f, msg: e.message });
    }
  }
  console.log(`\n[v0] DONE. ${ok}/${files.length} applied cleanly, ${failures.length} failed.`);
  if (failures.length) {
    console.log("[v0] FAILURES:");
    for (const x of failures) console.log(`   - ${x.f}: ${x.msg}`);
  }
  const t = await client.query("select count(*)::int n from information_schema.tables where table_schema='public'");
  const fn = await client.query("select count(*)::int n from information_schema.routines where routine_schema='public'");
  const tr = await client.query("select count(*)::int n from information_schema.triggers where trigger_schema='public'");
  console.log(`[v0] public tables=${t.rows[0].n} functions=${fn.rows[0].n} triggers=${tr.rows[0].n}`);
  await client.end();
}
main().catch(e => { console.log("[v0] FATAL", e.message); process.exit(1); });
