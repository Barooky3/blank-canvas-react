import type { SupabaseClient } from "@supabase/supabase-js";

// Some orders are placed through a stray copy of the shop that runs on a
// different Supabase backend but shares our Resend account. Those orders only
// exist as approval emails, so we rebuild them from the email log and store
// them in our own `orders` table, making them visible in the admin panel.

const OWN_PROJECT_REF = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "")
  .replace(/^https?:\/\//, "")
  .split(".")[0];

const EXTERNAL_PREFIX = "external-";

type ResendListItem = { id: string; subject: string; to: string[]; created_at: string };

type ParsedOrder = {
  extRef: string;
  extId: string;
  extNumber: number;
  customerName: string;
  customerEmail: string;
  address: { line1: string; line2: null; city: string; postalCode: string; country: string; shippingMethod: string };
  total: number;
  items: { name: string; brand: string; price: number; quantity: number; selectedMl?: number; image: string; affiliateUrl: string }[];
  giftCode: string | null;
};

const APPROVAL_SUBJECT = /^(\w+)\s+Order\s+#(\d+):\s*(.+?)\s+-\s+EUR/i;

async function resend<T>(key: string, path: string): Promise<T> {
  const res = await fetch(`https://api.resend.com${path}`, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`Resend ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");

const euro = (s: string) => Number(s.replace(/[^\d.,]/g, "").replace(",", "."));

function parseApprovalEmail(html: string): ParsedOrder | null {
  const link = html.match(/https:\/\/([a-z0-9]{20})\.supabase\.co\/functions\/v1\/handle-order-action\?id=([0-9a-f-]{36})/i);
  if (!link) return null;
  const text = decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

  const num = text.match(/Order #:\s*#(\d+)/);
  const name = text.match(/Customer:\s*(.+?)\s+Email:/);
  const email = text.match(/Email:\s*(\S+@\S+)/);
  const addr = text.match(/Address:\s*(.+?)\s+Total:/);
  const total = text.match(/Total:\s*€\s*([\d.,]+)/);
  if (!num || !name || !email || !total) return null;

  const parts = (addr?.[1] || "").split(",").map((p) => p.trim()).filter(Boolean);
  const country = parts.length >= 4 ? parts.pop()! : "";
  const postalCode = parts.length >= 3 ? parts.pop()! : "";
  const city = parts.length >= 2 ? parts.pop()! : "";

  const itemsSection = text.split(/Order Items/)[1]?.split(/Rewarble Code|Gift Card Code|Payment/i)[0] || "";
  const items: ParsedOrder["items"] = [];
  const itemRe = /\s*(.+?)\s+—\s+(.+?)(?:\s+—\s+(\d+)\s*ml)?\s+Qty:\s*(\d+)\s*·\s*€\s*([\d.,]+)/g;
  for (const m of itemsSection.matchAll(itemRe)) {
    items.push({
      brand: m[1].trim(),
      name: m[2].trim(),
      selectedMl: m[3] ? Number(m[3]) : undefined,
      quantity: Number(m[4]),
      price: euro(m[5]),
      image: "",
      affiliateUrl: "",
    });
  }

  const gift = text.match(/Rewarble Code\s+(.+)$/);

  return {
    extRef: link[1],
    extId: link[2],
    extNumber: Number(num[1]),
    customerName: name[1].trim(),
    customerEmail: email[1].trim().toLowerCase(),
    address: { line1: parts.join(", "), line2: null, city, postalCode, country, shippingMethod: "standard" },
    total: euro(total[1]),
    items,
    giftCode: gift ? gift[1].trim().slice(0, 500) : null,
  };
}

const externalRef = (method: string, o: { extRef: string; extNumber: number; extId: string }) =>
  `${method}-${EXTERNAL_PREFIX}${o.extRef}-n${o.extNumber}-${o.extId}`;

export const parseExternalRef = (ref: string) => {
  const m = ref?.match(/external-([a-z0-9]{20})-n(\d+)-/);
  return m ? { backend: m[1], number: Number(m[2]) } : null;
};

/** Status of an external order, inferred from the customer emails its backend sent. */
function statusFromEmails(list: ResendListItem[], number: number, customerEmail: string): string {
  const toCustomer = list.filter((e) => e.to.some((t) => t.toLowerCase() === customerEmail));
  if (toCustomer.some((e) => new RegExp(`Order #${number} Confirmed`, "i").test(e.subject))) return "approved";
  if (toCustomer.some((e) => new RegExp(`Order #${number} Update`, "i").test(e.subject))) return "rejected";
  return "pending_approval";
}

export async function syncExternalOrders(db: SupabaseClient, resendKey: string) {
  if (!resendKey) throw new Error("RESEND_API_KEY missing");
  const { data: list } = await resend<{ data: ResendListItem[] }>(resendKey, "/emails?limit=100");

  const { data: existing, error } = await db
    .from("orders")
    .select("id, order_number, customer_name, checkout_reference, status, customer_email")
    .gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString());
  if (error) throw error;

  const ownKeys = new Set(
    (existing || []).map((o) => {
      const ext = parseExternalRef(o.checkout_reference || "");
      return `${ext ? ext.number : o.order_number}|${(o.customer_name || "").toLowerCase()}`;
    }),
  );
  const importedIds = new Set((existing || []).map((o) => o.checkout_reference?.split("-").slice(-5).join("-")));

  let imported = 0;
  let updated = 0;

  for (const e of list) {
    const m = e.subject.match(APPROVAL_SUBJECT);
    if (!m) continue;
    const [, method, numberText, name] = m;
    if (ownKeys.has(`${numberText}|${name.toLowerCase()}`)) continue;

    const detail = await resend<{ html?: string }>(resendKey, `/emails/${e.id}`);
    const parsed = detail.html ? parseApprovalEmail(detail.html) : null;
    if (!parsed || parsed.extRef === OWN_PROJECT_REF || importedIds.has(parsed.extId)) continue;

    const { error: insertError } = await db.from("orders").insert({
      checkout_reference: externalRef(method.toLowerCase(), parsed),
      customer_name: parsed.customerName,
      customer_email: parsed.customerEmail,
      shipping_address: parsed.address,
      order_items: parsed.items,
      total_amount: parsed.total,
      gift_card_code: parsed.giftCode,
      status: statusFromEmails(list, parsed.extNumber, parsed.customerEmail),
      order_number: null,
      created_at: e.created_at,
    });
    if (!insertError) {
      imported++;
      importedIds.add(parsed.extId);
    } else if (insertError.code !== "23505") {
      throw insertError;
    }
  }

  // Keep imported orders in step when they get approved/rejected via the other backend's email links.
  for (const o of existing || []) {
    const ext = parseExternalRef(o.checkout_reference || "");
    if (!ext || o.status !== "pending_approval") continue;
    const status = statusFromEmails(list, ext.number, (o.customer_email || "").toLowerCase());
    if (status !== "pending_approval") {
      await db.from("orders").update({ status }).eq("id", o.id);
      updated++;
    }
  }

  return { imported, updated };
}
