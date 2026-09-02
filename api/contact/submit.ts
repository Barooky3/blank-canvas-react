import {
  adminDb, json, preflight, isEmail, clean, sendEmail, adminNotifyHtml, ADMIN_EMAIL, SITE_URL,
} from "../_lib/contact";

// POST /api/contact/submit  { name, email, subject, message }
export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const name = clean(body.name, 120);
  const email = clean(body.email, 200).toLowerCase();
  const subject = clean(body.subject, 200);
  const message = clean(body.message, 5000);

  if (!name || !email || !message) return json({ error: "Name, email and message are required" }, 400);
  if (!isEmail(email)) return json({ error: "Please enter a valid email address" }, 400);

  const db = adminDb();
  const { data: convo, error: cErr } = await db
    .from("contact_conversations")
    .insert({ customer_name: name, customer_email: email, subject, status: "new", admin_unread: true })
    .select("id")
    .single();
  if (cErr || !convo) return json({ error: "Could not save your message" }, 500);

  const { error: mErr } = await db
    .from("contact_messages")
    .insert({ conversation_id: convo.id, sender: "customer", body: message });
  if (mErr) return json({ error: "Could not save your message" }, 500);

  // Best-effort admin heads-up; never blocks the customer.
  void sendEmail({
    to: ADMIN_EMAIL,
    subject: `New contact message: ${subject || name}`,
    replyTo: email,
    html: adminNotifyHtml({
      customerName: name, customerEmail: email, subject, body: message,
      adminUrl: `${SITE_URL}/admin/orders?tab=messages`, isReply: false,
    }),
  });

  return json({ ok: true, id: convo.id });
}
