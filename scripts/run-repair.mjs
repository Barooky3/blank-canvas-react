import { Client } from "pg";
import { readFileSync } from "node:fs";
import { join } from "node:path";

let conn = process.env.POSTGRES_URL_NON_POOLING.replace(/([?&])(sslmode|ssl)=[^&]*/g, "$1").replace(/[?&]$/, "");
const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
await client.connect();

const sql = readFileSync(join(process.cwd(), "scripts", "repair.sql"), "utf8");
try {
  await client.query("begin");
  await client.query(sql);
  await client.query("commit");
  console.log("REPAIR OK");
} catch (e) {
  await client.query("rollback");
  console.log("REPAIR FAIL:", e.message);
  await client.end();
  process.exit(2);
}

// Record the 5 previously-failed migrations as applied so future runs skip them.
const failed = [
  "20260526195900_36fd26c2-12f7-45ea-b302-42da6bf424f7.sql",
  "20260601141150_36d5e3b0-65c8-4e24-b83f-c8538f6dc32e.sql",
  "20260724215248_db735d16-03e6-4e8b-b5d3-e25a59025ae6.sql",
  "20260724220811_1f95141d-1182-4fd5-9cc1-2217e8a773ca.sql",
  "20260724221413_00f70bf5-791e-4b04-9e68-b0d317d173d5.sql",
];
for (const name of failed) {
  await client.query(
    "insert into public._v0_migrations(name) values ($1) on conflict (name) do nothing",
    [name]
  );
}
console.log("Marked previously-failed migrations as reconciled.");

await client.end();
