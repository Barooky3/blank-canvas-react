import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------- config ----------
export const ADMIN_EMAIL = "ewhz3384@gmail.com";
const FROM = "Parfumistry Support <orders@parfumistry.net>";
const BRAND = "Parfumistry";

export const SITE_URL =
  process.env.PUBLIC_SITE_URL || "https://paforys.com";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
const ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

// ---------- responses ----------
export const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export function preflight(): Response {
  return new Response(null, { status: 204, headers: CORS });
}

// ---------- db ----------
export function adminDb(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Verifies the bearer token belongs to the single allowed admin. */
export async function requireAdmin(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data.user?.email) return null;
  const email = data.user.email.toLowerCase();
  return email === ADMIN_EMAIL ? email : null;
}

// ---------- validation ----------
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
export const clean = (s: unknown, max: number) =>
  typeof s === "string" ? s.trim().slice(0, max) : "";

// ---------- email ----------
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const nl2br = (s: string) => escapeHtml(s).replace(/\n/g, "<br/>");

export type ThreadMessage = { sender: "customer" | "admin"; body: string; created_at: string };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IE", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/** Branded, proper-looking reply email with the thread + a "Reply" button. */
export function replyEmailHtml(opts: {
  customerName: string;
  subject: string;
  latest: string;           // newest admin message body
  history: ThreadMessage[]; // full thread, oldest -> newest (excluding latest is fine)
  replyUrl: string;
}): string {
  const { customerName, subject, latest, history, replyUrl } = opts;
  const historyHtml = history
    .map((m) => {
      const mine = m.sender === "admin";
      return `
        <tr><td style="padding:0 0 12px 0;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${mine ? "#c9a96e" : "#8a8a8a"};margin:0 0 6px 0;">
            ${mine ? BRAND : escapeHtml(customerName)} &nbsp;·&nbsp; ${fmtDate(m.created_at)}
          </div>
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#2a2a2a;background:${mine ? "#faf6ee" : "#f4f4f4"};border-left:2px solid ${mine ? "#c9a96e" : "#d0d0d0"};padding:12px 14px;">
            ${nl2br(m.body)}
          </div>
        </td></tr>`;
    })
    .join("");

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#0d0d0d;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0d0d0d;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;">
  <!-- header -->
  <tr><td style="background:#0d0d0d;padding:28px 32px;text-align:center;border-bottom:1px solid #c9a96e;">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:.28em;color:#ffffff;text-transform:uppercase;">${BRAND}</div>
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:.2em;color:#c9a96e;text-transform:uppercase;margin-top:6px;">The Fragrance Library</div>
  </td></tr>
  <!-- body -->
  <tr><td style="padding:32px 32px 8px 32px;">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8a8a8a;">Re: ${escapeHtml(subject || "Your message")}</div>
    <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:22px;color:#111;margin:8px 0 18px 0;">Hi ${escapeHtml(customerName)},</h1>
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#2a2a2a;">${nl2br(latest)}</div>
    <p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#555;margin:22px 0 0 0;">Warm regards,<br/><span style="color:#111;">The ${BRAND} team</span></p>
  </td></tr>
  <!-- CTA -->
  <tr><td style="padding:28px 32px;" align="center">
    <a href="${replyUrl}" style="display:inline-block;background:#0d0d0d;color:#ffffff;text-decoration:none;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:.22em;text-transform:uppercase;padding:14px 34px;border:1px solid #c9a96e;">Reply to this message</a>
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#8a8a8a;margin-top:12px;">Click above to continue the conversation — no account needed.</div>
  </td></tr>
  ${history.length ? `
  <!-- thread -->
  <tr><td style="padding:0 32px 8px 32px;">
    <div style="border-top:1px solid #e6e6e6;margin:0 0 18px 0;"></div>
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8a8a8a;margin:0 0 14px 0;">Conversation so far</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${historyHtml}</table>
  </td></tr>` : ""}
  <!-- footer -->
  <tr><td style="background:#f7f7f7;padding:18px 32px;text-align:center;">
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#8a8a8a;line-height:1.6;">
      ${BRAND} · <a href="${SITE_URL}" style="color:#8a8a8a;">${SITE_URL.replace(/^https?:\/\//, "")}</a><br/>
      You're receiving this because you contacted us through our website.
    </div>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

/** Simple notification to the admin when a customer writes/replies. */
export function adminNotifyHtml(opts: {
  customerName: string; customerEmail: string; subject: string; body: string; adminUrl: string; isReply: boolean;
}): string {
  const { customerName, customerEmail, subject, body, adminUrl, isReply } = opts;
  return `<!doctype html><html><body style="margin:0;background:#f4f4f4;padding:24px;font-family:Helvetica,Arial,sans-serif;color:#222;">
  <div style="max-width:560px;margin:0 auto;background:#fff;padding:24px;border-top:3px solid #c9a96e;">
    <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#888;">${isReply ? "New reply in conversation" : "New contact message"}</div>
    <h2 style="font-weight:normal;margin:8px 0 16px 0;">${escapeHtml(subject || "(no subject)")}</h2>
    <div style="font-size:13px;color:#555;margin-bottom:12px;">From <strong>${escapeHtml(customerName)}</strong> &lt;${escapeHtml(customerEmail)}&gt;</div>
    <div style="font-size:14px;line-height:1.6;background:#f7f7f7;padding:14px;border-left:2px solid #c9a96e;">${nl2br(body)}</div>
    <p style="margin-top:20px;"><a href="${adminUrl}" style="display:inline-block;background:#0d0d0d;color:#fff;text-decoration:none;font-size:12px;letter-spacing:.18em;text-transform:uppercase;padding:12px 24px;">Open in admin</a></p>
  </div></body></html>`;
}

export async function sendEmail(opts: {
  to: string; subject: string; html: string; replyTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY missing" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
