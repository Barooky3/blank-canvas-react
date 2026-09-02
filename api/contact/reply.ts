import {
  adminDb, json, preflight, clean, sendEmail, adminNotifyHtml, ADMIN_EMAIL, SITE_URL,
} from "../_lib/contact";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Customer side, authenticated only by the secret reply_token from their email.
//   GET  /api/contact/reply?token=<uuid>        -> conversation + messages
//   POST /api/contact/reply { token, body }     -> add customer reply, notify admin
export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return preflight();
  const db = adminDb();

  if (req.method === "GET") {
    const token = new URL(req.url).searchParams.get("token") || "";
    if (!UUID.test(token)) return json({ error: "Invalid link" }, 400);

    const { data: convo, error } = await db
      .from("contact_conversations")
      .select("id, customer_name, subject, status, created_at")
      .eq("reply_token", token)
      .single();
    if (error || !convo) return json({ error: "This conversation could not be found" }, 404);

    const { data: messages } = await db
      .from("contact_messages")
      .select("id, sender, body, created_at")
      .eq("conversation_id", convo.id)
      .order("created_at", { ascending: true });

    return json({ conversation: convo, messages: messages ?? [] });
  }

  if (req.method === "POST") {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
    const token = clean(body.token, 64);
    const text = clean(body.body, 5000);
    if (!UUID.test(token)) return json({ error: "Invalid link" }, 400);
    if (!text) return json({ error: "Message cannot be empty" }, 400);

    const { data: convo, error } = await db
      .from("contact_conversations")
      .select("id, customer_name, customer_email, subject")
      .eq("reply_token", token)
      .single();
    if (error || !convo) return json({ error: "This conversation could not be found" }, 404);

    const now = new Date().toISOString();
    const { data: msg, error: mErr } = await db
      .from("contact_messages")
      .insert({ conversation_id: convo.id, sender: "customer", body: text, created_at: now })
      .select("id, sender, body, created_at")
      .single();
    if (mErr) return json({ error: mErr.message }, 500);

    await db
      .from("contact_conversations")
      .update({ admin_unread: true, last_message_at: now })
      .eq("id", convo.id);

    void sendEmail({
      to: ADMIN_EMAIL,
      subject: `Reply from ${convo.customer_name}: ${convo.subject || "conversation"}`,
      replyTo: convo.customer_email,
      html: adminNotifyHtml({
        customerName: convo.customer_name, customerEmail: convo.customer_email, subject: convo.subject,
        body: text, adminUrl: `${SITE_URL}/admin/orders?tab=messages`, isReply: true,
      }),
    });

    return json({ ok: true, message: msg });
  }

  return json({ error: "Method not allowed" }, 405);
}
