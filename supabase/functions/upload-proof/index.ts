import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAILS = ["ewhz3384@gmail.com"];

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function sendProofUploadedNotification(order: any, proofUrl: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) { console.error("RESEND_API_KEY not configured, skipping notification"); return; }

  const paymentMethod = order.checkout_reference?.startsWith("bank-transfer") ? "Bank Transfer" : "Revolut App";
  const orderNum = order.order_number;

  const proofLinks = proofUrl.split(",").map((url: string, i: number) =>
    `<a href="${url.trim()}" target="_blank" style="display:inline-block;background:#2563eb;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px;margin-right:8px;">📸 View Proof${proofUrl.includes(",") ? ` #${i+1}` : ""}</a>`
  ).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;background:#f4f3ef;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
  <div style="background:#1a1a1a;padding:24px;text-align:center;">
    <h1 style="color:#c9a96e;font-size:22px;margin:0;letter-spacing:3px;">PROOF OF PAYMENT UPLOADED</h1>
  </div>
  <div style="padding:24px;">
    <div style="background:#d1fae5;border:2px solid #10b981;padding:16px 20px;border-radius:8px;margin-bottom:16px;text-align:center;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#065f46;margin-bottom:8px;font-weight:600;">✅ Payment Proof Uploaded</div>
      ${proofLinks}
    </div>
    <table style="width:100%;margin-bottom:16px;font-size:14px;">
      ${orderNum ? `<tr><td style="padding:4px 0;color:#999;width:120px;">Order #:</td><td style="padding:4px 0;"><strong>#${orderNum}</strong></td></tr>` : ""}
      <tr><td style="padding:4px 0;color:#999;width:120px;">Customer:</td><td style="padding:4px 0;"><strong>${escapeHtml(order.customer_name)}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#999;">Email:</td><td style="padding:4px 0;">${escapeHtml(order.customer_email)}</td></tr>
      <tr><td style="padding:4px 0;color:#999;">Payment:</td><td style="padding:4px 0;">${paymentMethod}</td></tr>
      <tr><td style="padding:4px 0;color:#999;">Total:</td><td style="padding:4px 0;"><strong>€${Number(order.total_amount).toFixed(2)}</strong></td></tr>
    </table>
    <p style="font-size:13px;color:#666;margin:0;">You already received the approval email for this order. Please review the proof and approve/reject from there.</p>
  </div>
</div>
</body></html>`;

  const orderNumLabel = orderNum ? ` #${orderNum}` : "";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Parfumistry Orders <orders@parfumistry.net>",
      to: ADMIN_EMAILS,
      subject: `📸 Proof Uploaded${orderNumLabel}: ${order.customer_name || order.customer_email}`,
      html,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("Failed to send proof notification:", errBody);
  } else {
    console.log("Proof uploaded notification sent for order #" + orderNum);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const orderNumber = formData.get("orderNumber") as string;
    const file = formData.get("file") as File;

    if (!orderNumber || !file) {
      return new Response(JSON.stringify({ error: "Missing orderNumber or file" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify order exists
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, proof_url, customer_email, customer_name, order_items, total_amount, shipping_address, approval_token, checkout_reference, gift_card_code")
      .eq("order_number", parseInt(orderNumber))
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Upload file to storage
    const ext = file.name.split(".").pop() || "png";
    const fileName = `order-${orderNumber}-${Date.now()}.${ext}`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to upload file" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Generate signed URL (1-year expiry) since bucket is now private
    const { data: signedData, error: signedError } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(fileName, 60 * 60 * 24 * 365);

    if (signedError || !signedData?.signedUrl) {
      console.error("Signed URL error:", signedError);
      return new Response(JSON.stringify({ error: "Failed to generate proof URL" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const proofUrl = signedData.signedUrl;

    // Update order with proof URL (append if multiple)
    const existingProof = order.proof_url;
    const newProofUrl = existingProof ? `${existingProof},${proofUrl}` : proofUrl;

    const { error: updateError } = await supabase
      .from("orders")
      .update({ proof_url: newProofUrl })
      .eq("id", order.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update order" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log(`Proof uploaded for order #${orderNumber}: ${proofUrl}`);

    // Send proof uploaded notification to admin
    try {
      await sendProofUploadedNotification(order, newProofUrl);
    } catch (emailErr) {
      console.error("Failed to send proof notification:", emailErr);
    }

    return new Response(JSON.stringify({ success: true, proofUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error uploading proof:", error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
