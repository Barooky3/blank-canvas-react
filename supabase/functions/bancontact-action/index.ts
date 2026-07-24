// Handles the Approve / Reject / Split 50/50 links from the Bancontact emails.
// On approve: marks approved, credits full amount to the counter.
// On split:   marks split, credits half now, schedules second half +1 hour (paid by bancontact-timer-tick).
// On reject:  marks rejected, no credit.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildPage(title: string, msg: string, ok: boolean): string {
  const color = ok ? "#16a34a" : "#dc2626";
  const icon = ok ? "✓" : "✕";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:40px;background:#f4f3ef;font-family:Arial,sans-serif;text-align:center;">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="font-size:48px;margin-bottom:16px;color:${color};">${icon}</div>
  <h1 style="color:${color};font-size:24px;margin:0 0 12px;">${title}</h1>
  <p style="color:#666;font-size:16px;line-height:1.6;margin:0;">${msg}</p>
</div></body></html>`;
}

async function bumpCounter(supabase: ReturnType<typeof createClient>) {
  // The counter row has a BEFORE trigger that recalculates everything from
  // bancontact_orders. We just need to touch it so realtime fires.
  await supabase.from("bancontact_live_counter").update({ updated_at: new Date().toISOString() }).eq("id", 1);
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function buildBancontactInvoiceHtml(order: any): string {
  const year = new Date().getFullYear();
  const now = new Date();
  const orderDate = now.toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/Amsterdam" });
  const invoiceNo = "BC-" + now.getFullYear() + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0") + "-" + String(now.getHours()).padStart(2, "0") + String(now.getMinutes()).padStart(2, "0") + String(now.getSeconds()).padStart(2, "0");
  const items: any[] = Array.isArray(order.order_items) ? order.order_items : [];
  const itemRows = items.map((item, i) => {
    const mlLabel = item.selectedMl ? ` - ${item.selectedMl}ml` : "";
    const qty = item.quantity || 1;
    const price = Number(item.price) || 0;
    const lineTotal = (price * qty).toFixed(2);
    const bg = i % 2 === 0 ? "#ffffff" : "#fafaf8";
    return `<tr style="background:${bg};">
      <td style="padding:12px 10px;border-bottom:1px solid #f0ede8;font-size:13px;color:#333;">${escapeHtml(item.brand || "")} - ${escapeHtml(item.name || "")}${mlLabel}</td>
      <td style="padding:12px 10px;border-bottom:1px solid #f0ede8;font-size:13px;text-align:center;color:#333;">${qty}</td>
      <td style="padding:12px 10px;border-bottom:1px solid #f0ede8;font-size:13px;text-align:right;color:#333;">EUR${price.toFixed(2)}</td>
      <td style="padding:12px 10px;border-bottom:1px solid #f0ede8;font-size:13px;text-align:right;color:#333;font-weight:500;">EUR${lineTotal}</td>
    </tr>`;
  }).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f3ef;font-family:Helvetica Neue,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#1a1a1a;padding:36px 32px;text-align:center;">
    <h1 style="color:#c9a96e;font-size:26px;font-weight:300;letter-spacing:5px;margin:0;text-transform:uppercase;">Parfumistry</h1>
    <p style="color:#666;font-size:12px;letter-spacing:2px;margin:8px 0 0;text-transform:uppercase;">Bancontact Invoice</p>
  </div>
  <div style="padding:32px;">
    <div style="display:flex;justify-content:space-between;margin-bottom:20px;">
      <div>
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:4px;">Invoice No</div>
        <div style="font-size:14px;font-weight:600;color:#333;">${invoiceNo}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:4px;">Approved</div>
        <div style="font-size:14px;color:#333;">${orderDate}</div>
      </div>
    </div>
    <table style="width:100%;margin-bottom:16px;font-size:13px;">
      <tr><td style="padding:4px 0;color:#999;width:100px;">Customer:</td><td style="padding:4px 0;"><strong>${escapeHtml(order.customer_name || "")}</strong></td></tr>
      
      ${order.country ? `<tr><td style="padding:4px 0;color:#999;">Country:</td><td style="padding:4px 0;">${escapeHtml(order.country)}</td></tr>` : ""}
      <tr><td style="padding:4px 0;color:#999;">Payment:</td><td style="padding:4px 0;">Bancontact</td></tr>
    </table>
    <div style="border-top:2px solid #1a1a1a;padding-top:12px;margin-bottom:16px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:8px;">Order Items</div>
      <table style="width:100%;">
        <thead><tr style="background:#f4f3ef;">
          <th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;">Item</th>
          <th style="padding:8px 10px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;">Qty</th>
          <th style="padding:8px 10px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;">Price</th>
          <th style="padding:8px 10px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;">Total</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>
    <div style="text-align:right;padding-top:12px;border-top:2px solid #1a1a1a;">
      <span style="font-size:14px;color:#999;">Total:</span>
      <span style="font-size:20px;font-weight:700;color:#1a1a1a;margin-left:8px;">EUR${Number(order.total_amount).toFixed(2)}</span>
    </div>
  </div>
  <div style="background:#1a1a1a;padding:28px 32px;text-align:center;">
    <p style="color:#c9a96e;font-size:14px;letter-spacing:3px;margin:0 0 8px;text-transform:uppercase;">Parfumistry</p>
    <p style="color:#666;font-size:11px;margin:0;">&copy; ${year} Parfumistry. All rights reserved.</p>
  </div>
</div>
</body></html>`;
}

async function sendInvoiceEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Parfumistry Orders <orders@parfumistry.net>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error("Resend API error (" + res.status + "): " + errBody);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const token = url.searchParams.get("token");
    const action = url.searchParams.get("action");
    if (!id || !token || !action || !["approve", "reject", "split"].includes(action)) {
      return new Response(buildPage("Invalid Link", "Missing or invalid parameters.", false),
        { headers: { "Content-Type": "text/html" }, status: 400 });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: order, error } = await supabase
      .from("bancontact_orders")
      .select("*")
      .eq("id", id)
      .eq("approval_token", token)
      .maybeSingle();
    if (error || !order) {
      return new Response(buildPage("Invalid Link", "This link is invalid or has already been used.", false),
        { headers: { "Content-Type": "text/html" }, status: 404 });
    }

    if (order.status !== "pending") {
      return new Response(buildPage("Already Handled", `This order has already been ${order.status}.`, false),
        { headers: { "Content-Type": "text/html" }, status: 200 });
    }

    const now = new Date();
    if (action === "approve") {
      await supabase.from("bancontact_orders").update({
        status: "approved",
        approved_at: now.toISOString(),
        updated_at: now.toISOString(),
      }).eq("id", id);
      await bumpCounter(supabase);
      // Bancontact emails disabled — no invoice email is sent.
      void buildBancontactInvoiceHtml; void sendInvoiceEmail;
      return new Response(buildPage("Approved", `Full amount €${Number(order.total_amount).toFixed(2)} added to the Bancontact live tally.`, true),
        { headers: { "Content-Type": "text/html" }, status: 200 });
    }

    if (action === "reject") {
      await supabase.from("bancontact_orders").update({
        status: "rejected",
        rejected_at: now.toISOString(),
        updated_at: now.toISOString(),
      }).eq("id", id);
      await bumpCounter(supabase);
      return new Response(buildPage("Rejected", "This Bancontact order has been rejected. Nothing was added to the tally.", true),
        { headers: { "Content-Type": "text/html" }, status: 200 });
    }

    // action === "split"
    const dueAt = new Date(now.getTime() + 60 * 60 * 1000);
    await supabase.from("bancontact_orders").update({
      status: "split",
      split_first_at: now.toISOString(),
      split_second_due_at: dueAt.toISOString(),
      updated_at: now.toISOString(),
    }).eq("id", id);
    await bumpCounter(supabase);
    const half = (Number(order.total_amount) / 2).toFixed(2);
    return new Response(buildPage(
      "Split 50/50 Accepted",
      `€${half} added to the live tally now. The remaining €${half} will be added at ${dueAt.toUTCString()}.`,
      true,
    ), { headers: { "Content-Type": "text/html" }, status: 200 });
  } catch (e: any) {
    console.error("bancontact-action error:", e);
    return new Response(buildPage("Error", "Something went wrong. Please try again.", false),
      { headers: { "Content-Type": "text/html" }, status: 500 });
  }
});
