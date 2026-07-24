import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "ewhz3384@gmail.com"; // reply-to address only

function buildProofRequestEmailHtml(customerName: string, totalAmount: string, orderNumber?: number | null): string {
  const year = new Date().getFullYear();
  const orderNumText = orderNumber ? `<p style="font-size:13px;color:#999;margin:0 0 12px;">Order Number: <strong style="color:#1a1a1a;">#${orderNumber}</strong></p>` : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f3ef;font-family:Helvetica Neue,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#1a1a1a;padding:36px 32px;text-align:center;">
    <h1 style="color:#c9a96e;font-size:26px;font-weight:300;letter-spacing:5px;margin:0;text-transform:uppercase;">Parfumistry</h1>
    <p style="color:#666;font-size:12px;letter-spacing:2px;margin:8px 0 0;text-transform:uppercase;">Premium Fragrances</p>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 16px;">Proof of Payment Required</h2>
    ${orderNumText}
    <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 16px;">Hi <strong>${customerName}</strong>,</p>
    <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 16px;">Thank you for your order of <strong>€${totalAmount}</strong>. To process your order, we need to verify your payment.</p>
    <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 24px;">Please <strong>reply to this email</strong> with a screenshot or photo of your payment confirmation (e.g. bank transfer receipt, transaction confirmation).</p>
    <div style="background:#eff6ff;border:2px solid #2563eb;padding:16px 20px;border-radius:8px;margin-bottom:24px;">
      <p style="font-size:13px;color:#1e40af;margin:0;line-height:1.6;">📸 <strong>How to send proof:</strong><br/>Simply reply to this email and attach a screenshot or photo of your payment. You can use your phone's camera or take a screenshot of your banking app.</p>
    </div>
    <p style="font-size:13px;color:#999;line-height:1.6;margin:0;">Once verified, we'll confirm your order and send you a confirmation email with all the details.${orderNumber ? ' Please reference order <strong>#' + orderNumber + '</strong> in your reply.' : ''}</p>
  </div>
  <div style="background:#1a1a1a;padding:28px 32px;text-align:center;">
    <p style="color:#c9a96e;font-size:14px;letter-spacing:3px;margin:0 0 8px;text-transform:uppercase;">Parfumistry</p>
    <p style="color:#666;font-size:11px;margin:0;">&copy; ${year} Parfumistry. All rights reserved.</p>
  </div>
</div>
</body></html>`;
}

function buildResultPage(title: string, message: string, success: boolean): string {
  const color = success ? "#16a34a" : "#dc2626";
  const icon = success ? "✅" : "❌";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:40px;background:#f4f3ef;font-family:Arial,sans-serif;text-align:center;">
<div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
  <div style="font-size:48px;margin-bottom:16px;">${icon}</div>
  <h1 style="color:${color};font-size:24px;margin:0 0 12px;">${title}</h1>
  <p style="color:#666;font-size:16px;line-height:1.6;margin:0;">${message}</p>
</div>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("id");
    const token = url.searchParams.get("token");
    const wantsJson = req.headers.get("Accept")?.includes("application/json");

    if (!orderId || !token) {
      if (wantsJson) {
        return new Response(JSON.stringify({ error: "Missing order ID or token" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
        });
      }
      return new Response(buildResultPage("Invalid Link", "Missing order ID or token.", false), {
        headers: { ...corsHeaders, "Content-Type": "text/html" }, status: 400,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("approval_token", token)
      .single();

    if (error || !order) {
      if (wantsJson) {
        return new Response(JSON.stringify({ error: "Order not found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404,
        });
      }
      return new Response(buildResultPage("Invalid Link", "This link is invalid or has already been used.", false), {
        headers: { ...corsHeaders, "Content-Type": "text/html" }, status: 404,
      });
    }

    const html = buildProofRequestEmailHtml(
      order.customer_name || "Valued Customer",
      order.total_amount.toString(),
      order.order_number,
    );

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) throw new Error("RESEND_API_KEY not configured");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Parfumistry <orders@parfumistry.net>",
        to: [order.customer_email],
        reply_to: ADMIN_EMAIL,
        subject: order.order_number ? `Proof of Payment Required — Order #${order.order_number} — Parfumistry` : "Proof of Payment Required — Parfumistry",
        html: html,
      }),
    });

    let emailWarning = "";
    if (!res.ok) {
      const errBody = await res.text();
      console.error("Resend error sending proof request:", errBody);
      emailWarning = `The email to ${order.customer_email} could not be delivered.`;
    } else {
      console.log("Proof of payment email sent to:", order.customer_email);
    }

    const resultMsg = emailWarning
      ? `Warning: ${emailWarning}`
      : `Proof of payment request sent to ${order.customer_email}.`;

    if (wantsJson) {
      return new Response(JSON.stringify({ success: !emailWarning, message: resultMsg }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    return new Response(
      buildResultPage(emailWarning ? "Email Issue" : "Proof Requested", resultMsg, !emailWarning),
      { headers: { ...corsHeaders, "Content-Type": "text/html" }, status: 200 },
    );
  } catch (error) {
    console.error("Error requesting proof:", error);
    const wantsJson = req.headers.get("Accept")?.includes("application/json");
    if (wantsJson) {
      return new Response(JSON.stringify({ error: "Something went wrong" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
      });
    }
    return new Response(buildResultPage("Error", "Something went wrong. Please try again.", false), {
      headers: { ...corsHeaders, "Content-Type": "text/html" }, status: 500,
    });
  }
});
