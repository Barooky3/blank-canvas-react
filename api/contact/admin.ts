import {
  adminDb, json, preflight, requireAdmin, clean, sendEmail, replyEmailHtml, SITE_URL, type ThreadMessage,
} from "../_lib/contact";

// Admin-only. Bearer = Supabase access token of ewhz3384@gmail.com.
//   GET    /api/contact/admin                  -> all conversations with messages
//   POST   /api/contact/admin { action:"reply", conversationId, body } -> reply + email customer
//   POST   /api/contact/admin { action:"read",  conversationId }       -> mark read
//   DELETE /api/contact/admin?id=<uuid>        -> delete conversation (+ messages)
export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return preflight();

  const admin = await requireAdmin(req);
  if (!admin) return json({ error: "Unauthorized" }, 401);

  const db = adminDb();

  if (req.method === "GET") {
    const { data: convos, error } = await db
      .from("contact_conversations")
      .select("id, customer_name, customer_email, subject, status, admin_unread, created_at, last_message_at")
      .order("last_message_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);

    const ids = (convos ?? []).map((c) => c.id);
    let messages: Array<ThreadMessage & { id: string; conversation_id: string }> = [];
    if (ids.length) {
      const { data: msgs, error: mErr } = await db
        .from("contact_messages")
        .select("id, conversation_id, sender, body, created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: true });
      if (mErr) return json({ error: mErr.message }, 500);
      messages = (msgs ?? []) as typeof messages;
    }

    const byConvo = new Map<string, typeof messages>();
    for (const m of messages) {
      const arr = byConvo.get(m.conversation_id) ?? [];
      arr.push(m);
      byConvo.set(m.conversation_id, arr);
    }
    return json({
      conversations: (convos ?? []).map((c) => ({ ...c, messages: byConvo.get(c.id) ?? [] })),
    });
  }

  if (req.method === "DELETE") {
    const id = new URL(req.url).searchParams.get("id") || "";
    if (!id) return json({ error: "id required" }, 400);
    const { error } = await db.from("contact_conversations").delete().eq("id", id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  if (req.method === "POST") {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
    const action = clean(body.action, 20);
    const conversationId = clean(body.conversationId, 64);
    if (!conversationId) return json({ error: "conversationId required" }, 400);

    if (action === "read") {
      const { error } = await db
        .from("contact_conversations").update({ admin_unread: false }).eq("id", conversationId);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "reply") {
      const text = clean(body.body, 5000);
      if (!text) return json({ error: "Reply cannot be empty" }, 400);

      const { data: convo, error: cErr } = await db
        .from("contact_conversations")
        .select("id, customer_name, customer_email, subject, reply_token")
        .eq("id", conversationId)
        .single();
      if (cErr || !convo) return json({ error: "Conversation not found" }, 404);

      const { data: history } = await db
        .from("contact_messages")
        .select("sender, body, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      const now = new Date().toISOString();
      const { error: mErr } = await db
        .from("contact_messages")
        .insert({ conversation_id: conversationId, sender: "admin", body: text, created_at: now });
      if (mErr) return json({ error: mErr.message }, 500);

      await db
        .from("contact_conversations")
        .update({ status: "active", admin_unread: false, last_message_at: now })
        .eq("id", conversationId);

      const replyUrl = `${SITE_URL}/reply/${convo.reply_token}`;
      const mail = await sendEmail({
        to: convo.customer_email,
        subject: `Re: ${convo.subject || "Your message to Parfumistry"}`,
        html: replyEmailHtml({
          customerName: convo.customer_name,
          subject: convo.subject,
          latest: text,
          history: (history ?? []) as ThreadMessage[],
          replyUrl,
        }),
      });

      return json({ ok: true, emailed: mail.ok, emailError: mail.error });
    }

    return json({ error: "Unknown action" }, 400);
  }

  return json({ error: "Method not allowed" }, 405);
}
