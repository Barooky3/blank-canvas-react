import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const REF = "kolnekutwubdwqpgzaob";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error("Missing SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}

const FN_DIR = "supabase/functions";
const only = process.argv[2]; // optional: deploy a single function
let fns = readdirSync(FN_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);
if (only) fns = fns.filter((f) => f === only);

let ok = 0;
let fail = 0;
for (const fn of fns) {
  const src = readFileSync(join(FN_DIR, fn, "index.ts"), "utf8");
  const form = new FormData();
  form.append(
    "metadata",
    JSON.stringify({ entrypoint_path: "index.ts", verify_jwt: false, name: fn }),
  );
  form.append("file", new Blob([src], { type: "application/typescript" }), "index.ts");

  const url = `https://api.supabase.com/v1/projects/${REF}/functions/deploy?slug=${fn}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: form,
    });
    if (res.ok) {
      console.log(`OK   ${fn}`);
      ok++;
    } else {
      const txt = await res.text();
      console.log(`FAIL ${fn} [${res.status}] ${txt.slice(0, 300)}`);
      fail++;
    }
  } catch (e) {
    console.log(`ERR  ${fn} ${e.message}`);
    fail++;
  }
  // Gentle pacing to stay under rate limits.
  await new Promise((r) => setTimeout(r, 400));
}
console.log(`\nDone. ${ok} succeeded, ${fail} failed.`);
