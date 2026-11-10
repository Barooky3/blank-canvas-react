import { createClient } from "@supabase/supabase-js";
import { adminDb, json, preflight } from "./_lib/contact.js";

// Returns the reason section of the rejection email a customer received for
// one of their own orders, so the account page can show the exact same text.

type ResendList = { data: { id: string; subject: string; to: string[] }[]; has_more?: boolean };

const MAX_PAGES = 5;

async function resend<T>(key: string, path: string): Promise<T> {
  const res = await fetch(`https://api.resend.com${path}`, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`Resend ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

async function userEmail(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const client = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await client.auth.getUser(token);
  return error ? null : data.user?.email?.toLowerCase() || null;
}

function sanitize(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|embed|form)[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|iframe|object|embed|link|meta)[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
}

function extractReason(html: string): string | null {
  const greeting = html.search(/<p[^>]*>\s*Hi\s/i);
  if (greeting === -1) return null;
  const afterGreeting = html.indexOf("</p>", greeting);
  if (afterGreeting === -1) return null;
  const start = afterGreeting + 4;
  const helpBox = html.search(/<div[^>]*background:#faf9f6/i);
  const end = helpBox > start ? helpBox : html.search(/Need help\?/i);
  if (end <= start) return null;
  const section = sanitize(html.slice(start, end)).trim();
  return section || null;
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const email = await userEmail(req);
  if (!email) return json({ error: "Unauthorized" }, 401);

  let orderId = "";
  try {
    const body = (await req.json()) as { orderId?: unknown };
    orderId = typeof body.orderId === "string" ? body.orderId : "";
  } catch {
    return json({ error: "Invalid body" }, 400);
  }
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return json({ error: "Invalid order" }, 400);

  const { data: order, error } = await adminDb()
    .from("orders")
    .select("id, order_number, customer_email, status")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !order || (order.customer_email || "").toLowerCase() !== email) {
    return json({ error: "Not found" }, 404);
  }
  if (order.status !== "rejected" || !order.order_number) return json({ html: null });

  const key = process.env.RESEND_API_KEY || "";
  if (!key) return json({ html: null });

  try {
    const subject = `Order #${order.order_number} Update`;
    let after = "";
    for (let page = 0; page < MAX_PAGES; page++) {
      const list = await resend<ResendList>(key, `/emails?limit=100${after ? `&after=${after}` : ""}`);
      const match = list.data.find(
        (e) => e.subject?.includes(subject) && e.to?.some((t) => t.toLowerCase() === email),
      );
      if (match) {
        const detail = await resend<{ html?: string }>(key, `/emails/${match.id}`);
        return json({ html: detail.html ? extractReason(detail.html) : null });
      }
      if (!list.has_more || list.data.length === 0) break;
      after = list.data[list.data.length - 1].id;
    }
  } catch (e) {
    console.error("rejection-email lookup failed:", e);
  }
  return json({ html: null });
}

export default { fetch: handler };
