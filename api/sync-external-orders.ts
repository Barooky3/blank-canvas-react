import { createClient } from "@supabase/supabase-js";
import { adminDb, json, preflight } from "./_lib/contact.js";
import { syncExternalOrders } from "./_lib/externalOrders.js";

const ADMIN_EMAILS = ["ewhz3384@gmail.com", "elkhabirmalik@gmail.com"];

async function isAdmin(req: Request): Promise<boolean> {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return false;
  const client = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await client.auth.getUser(token);
  return !error && ADMIN_EMAILS.includes((data.user?.email || "").toLowerCase());
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!(await isAdmin(req))) return json({ error: "Unauthorized" }, 401);
  try {
    return json(await syncExternalOrders(adminDb(), process.env.RESEND_API_KEY || ""));
  } catch (e) {
    console.error("sync-external-orders failed:", e);
    return json({ error: "Sync failed" }, 500);
  }
}

export default { fetch: handler };
