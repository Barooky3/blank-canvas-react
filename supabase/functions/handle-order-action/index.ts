import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const ADMIN_EMAILS = ["ewhz3384@gmail.com"];

interface OrderItem {
  name: string;
  brand: string;
  image: string;
  price: number;
  quantity: number;
  selectedMl?: number;
}

const DEFAULT_SELLER_LINK = "https://litbuy.shop/lit/I2wvc0a2";

const PRODUCT_LINKS: Record<string, string> = {
  "stronger-with-you-absolutely": "https://litbuy.shop/lit/nOAwjxV0",
  "stronger-with-you": "https://litbuy.shop/lit/nOAwjxV0",
  "aventus": "https://m.kakobuy.com/pages/goods-detail/goods-detail?url=https%3A%2F%2Fweidian.com%2Fitem.html%3FitemID%3D7661817242&affcode=c5v3b",
  "born-in-roma-intense": "https://litbuy.com/product/0/942511489889?inviteCode=4W9SCOLDU",
  "born-in-roma-green-stravaganza": "https://litbuy.com/product/0/942511489889?inviteCode=4W9SCOLDU",
  "born-in-roma-coral-fantasy": "https://litbuy.com/product/0/942511489889?inviteCode=4W9SCOLDU",
  "born-in-roma": "https://litbuy.com/product/0/942511489889?inviteCode=4W9SCOLDU",
  "valentino": "https://litbuy.com/product/0/942511489889?inviteCode=4W9SCOLDU",
  "louis-vuitton": "https://m.kakobuy.com/pages/goods-detail/goods-detail?url=https%3A%2F%2Fweidian.com%2Fitem.html%3FitemID%3D7661789506&affcode=c5v3b",
  "xerjoff": "https://m.kakobuy.com/pages/goods-detail/goods-detail?url=https%3A%2F%2Fweidian.com%2Fitem.html%3FitemID%3D7662173327&affcode=c5v3b",
  "eros": "https://m.kakobuy.com/pages/goods-detail/goods-detail?url=https%3A%2F%2Fweidian.com%2Fitem.html%3FitemID%3D7665241752&affcode=c5v3b",
  "dior": "https://m.kakobuy.com/pages/goods-detail/goods-detail?url=https%3A%2F%2Fweidian.com%2Fitem.html%3FitemID%3D7661870378&affcode=c5v3b",
  "parfums-de-marly": "https://m.orientdig.com/pages/product/product?id=857200052892&shoptype=ALI_1688&ref=100144636",
  "jean-paul-gaultier": "https://litbuy.shop/lit/JeaFpAPH",
  "lattafa": "https://litbuy.shop/lit/XVWEmSku",
  "azzaro": "https://litbuy.shop/lit/hVExk1tS",
  "mancera": "https://litbuy.shop/lit/qYJ4Tj6g",
};

function getProductLink(name: string, brand: string): string {
  const n = name.toLowerCase();
  const b = brand.toLowerCase();
  if (n.includes("stronger with you absolutely")) return PRODUCT_LINKS["stronger-with-you-absolutely"];
  if (n.includes("stronger with you")) return PRODUCT_LINKS["stronger-with-you"];
  if (n.includes("aventus")) return PRODUCT_LINKS["aventus"];
  if (n.includes("born in roma intense")) return PRODUCT_LINKS["born-in-roma-intense"];
  if (n.includes("born in roma green stravaganza")) return PRODUCT_LINKS["born-in-roma-green-stravaganza"];
  if (n.includes("born in roma coral fantasy")) return PRODUCT_LINKS["born-in-roma-coral-fantasy"];
  if (n.includes("born in roma")) return PRODUCT_LINKS["born-in-roma"];
  if (b.includes("valentino")) return PRODUCT_LINKS["valentino"];
  if (b.includes("louis vuitton")) return PRODUCT_LINKS["louis-vuitton"];
  if (b.includes("xerjoff")) return PRODUCT_LINKS["xerjoff"];
  if (n.includes("eros")) return PRODUCT_LINKS["eros"];
  if (b.includes("dior")) return PRODUCT_LINKS["dior"];
  if (b.includes("parfums de marly")) return PRODUCT_LINKS["parfums-de-marly"];
  if (b.includes("jean paul gaultier")) return PRODUCT_LINKS["jean-paul-gaultier"];
  if (b.includes("lattafa")) return PRODUCT_LINKS["lattafa"];
  if (b.includes("azzaro")) return PRODUCT_LINKS["azzaro"];
  if (b.includes("mancera")) return PRODUCT_LINKS["mancera"];
  return DEFAULT_SELLER_LINK;
}

function buildResultPage(title: string, message: string, success: boolean): string {
  const color = success ? "#16a34a" : "#dc2626";
  const icon = success ? "V" : "X";
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

function buildRejectionEmailHtml(customerName: string, isGiftCard: boolean = false, orderNumber?: number | null, isBankTransfer: boolean = false): string {
  const year = new Date().getFullYear();
  let reason: string;
  if (isGiftCard) {
    reason = "Unfortunately, the Rewarble code you provided for your recent order could not be verified and is invalid. Your order has been cancelled.<br><br><strong>Reminder:</strong> The gift card code should be a 16-character alphanumeric code (e.g. <code style=\"background:#f0f0f0;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px;\">9YVMBH7H4CXHCX7J</code>), not the Rewarble order number.";
  } else if (isBankTransfer) {
    reason = "Unfortunately, your bank transfer could not be verified or was bounced back by the receiving bank. Your order has been cancelled.<br><br><strong>If you did send the payment, don't worry -- your money is already on its way back to your account.</strong> Depending on your bank, it may take 1-3 business days to appear in your balance.";
  } else {
    reason = "Unfortunately, your payment could not be verified and did not go through. <strong>No money has been taken from your account.</strong>";
  }
  const tutorialBanner = isGiftCard ? `
    <a href="https://parfumistry.net/videos/rewarble-tutorial.mp4" style="display:block;text-decoration:none;background:linear-gradient(135deg,#fef3c7,#fde68a);border:3px solid #d97706;padding:20px 24px;border-radius:10px;margin:0 0 24px;text-align:center;" target=\"_blank\">
      <div style="font-size:28px;margin-bottom:8px;">⚠️ 🎬</div>
      <p style="font-size:16px;font-weight:700;color:#92400e;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Important: Watch the Tutorial Video</p>
      <p style="font-size:14px;color:#92400e;line-height:1.5;margin:0;">A short tutorial video shows exactly how to find the correct 16-character gift card code. <strong>Click here to watch it before reordering</strong> to avoid the same issue.</p>
    </a>` : "";
  let nextStep: string;
  if (isGiftCard) {
    nextStep = "If you believe this is an error, please contact us and we'll be happy to assist you.";
  } else if (isBankTransfer) {
    nextStep = "If you'd like to try again, please place a new order and make sure to include your email address in the payment reference so we can match your transfer. If you have any questions, don't hesitate to reach out.";
  } else {
    nextStep = "Please try again and ensure the payment is completed successfully before confirming your order. If the issue persists, feel free to reach out to us for assistance.";
  }
  const orderNumText = orderNumber ? `<p style="font-size:13px;color:#999;margin:0 0 12px;">Order Number: <strong style="color:#1a1a1a;">#${orderNumber}</strong></p>` : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f3ef;font-family:Helvetica Neue,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#1a1a1a;padding:36px 32px;text-align:center;">
    <h1 style="color:#c9a96e;font-size:26px;font-weight:300;letter-spacing:5px;margin:0;text-transform:uppercase;">Parfumistry</h1>
    <p style="color:#666;font-size:12px;letter-spacing:2px;margin:8px 0 0;text-transform:uppercase;">Premium Fragrances</p>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 16px;">Payment Not Received</h2>
    ${orderNumText}
    <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 16px;">Hi <strong>${escapeHtml(customerName)}</strong>,</p>
    ${tutorialBanner}
    <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 16px;">${reason}</p>
    <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 24px;">${nextStep}</p>
    <div style="background:#faf9f6;border:1px solid #eee;padding:20px 24px;border-radius:8px;text-align:center;">
      <p style="font-size:13px;color:#666;margin:0;line-height:1.6;">Need help? Contact us at<br>
      <a href="mailto:support@parfumistry.net" style="color:#c9a96e;text-decoration:none;font-weight:500;">support@parfumistry.net</a>${orderNumber ? '<br><span style="font-size:12px;color:#999;">Please include your order number: <strong>#' + orderNumber + '</strong></span>' : ''}</p>
    </div>
  </div>
  <div style="background:#1a1a1a;padding:28px 32px;text-align:center;">
    <p style="color:#c9a96e;font-size:14px;letter-spacing:3px;margin:0 0 8px;text-transform:uppercase;">Parfumistry</p>
    <p style="color:#666;font-size:11px;margin:0;">&copy; ${year} Parfumistry. All rights reserved.</p>
  </div>
</div>
</body></html>`;
}

function buildAdminInvoiceHtml(
  customerName: string,
  customerEmail: string,
  items: OrderItem[],
  totalAmount: string,
  billingAddress: { line1?: string; city?: string; postalCode?: string; country?: string },
  paymentMethod: string,
  giftCardCode?: string,
): string {
  const year = new Date().getFullYear();
  const now = new Date();
  const orderDate = now.toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/Amsterdam" });
  const invoiceNo = "INV-" + now.getFullYear() + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0") + "-" + String(now.getHours()).padStart(2, "0") + String(now.getMinutes()).padStart(2, "0") + String(now.getSeconds()).padStart(2, "0");
  const addressText = [billingAddress.line1, billingAddress.city, billingAddress.postalCode, billingAddress.country].filter(Boolean).join(", ") || "N/A";

  const itemRows = items.map((item, i) => {
    const mlLabel = item.selectedMl ? ` - ${item.selectedMl}ml` : "";
    const lineTotal = (item.price * item.quantity).toFixed(2);
    const bg = i % 2 === 0 ? "#ffffff" : "#fafaf8";
    const productLink = getProductLink(item.name, item.brand);
    return `<tr style="background:${bg};">
      <td style="padding:12px 10px;border-bottom:1px solid #f0ede8;font-size:13px;color:#333;">${item.brand} - ${item.name}${mlLabel} <a href="${productLink}" style="color:#c9a96e;font-weight:500;text-decoration:none;">(link)</a></td>
      <td style="padding:12px 10px;border-bottom:1px solid #f0ede8;font-size:13px;text-align:center;color:#333;">${item.quantity}</td>
      <td style="padding:12px 10px;border-bottom:1px solid #f0ede8;font-size:13px;text-align:right;color:#333;">EUR${item.price.toFixed(2)}</td>
      <td style="padding:12px 10px;border-bottom:1px solid #f0ede8;font-size:13px;text-align:right;color:#333;font-weight:500;">EUR${lineTotal}</td>
    </tr>`;
  }).join("");

  const giftCardSection = giftCardCode ? `<div style="background:#fef3c7;border:2px solid #f59e0b;padding:12px 16px;border-radius:8px;margin-bottom:20px;">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#92400e;margin-bottom:4px;font-weight:600;">Rewarble Code</div>
    <div style="font-size:18px;font-weight:700;color:#92400e;letter-spacing:2px;font-family:monospace;">${giftCardCode}</div>
  </div>` : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f3ef;font-family:Helvetica Neue,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#1a1a1a;padding:36px 32px;text-align:center;">
    <h1 style="color:#c9a96e;font-size:26px;font-weight:300;letter-spacing:5px;margin:0;text-transform:uppercase;">Parfumistry</h1>
    <p style="color:#666;font-size:12px;letter-spacing:2px;margin:8px 0 0;text-transform:uppercase;">Admin Invoice</p>
  </div>
  <div style="padding:32px;">
    <div style="display:flex;justify-content:space-between;margin-bottom:20px;">
      <div>
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:4px;">Invoice No</div>
        <div style="font-size:14px;font-weight:600;color:#333;">${invoiceNo}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:4px;">Date</div>
        <div style="font-size:14px;color:#333;">${orderDate}</div>
      </div>
    </div>
    <table style="width:100%;margin-bottom:16px;font-size:13px;">
      <tr><td style="padding:4px 0;color:#999;width:100px;">Customer:</td><td style="padding:4px 0;"><strong>${escapeHtml(customerName)}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#999;">Email:</td><td style="padding:4px 0;">${escapeHtml(customerEmail)}</td></tr>
      <tr><td style="padding:4px 0;color:#999;">Address:</td><td style="padding:4px 0;">${escapeHtml(addressText)}</td></tr>
      <tr><td style="padding:4px 0;color:#999;">Payment:</td><td style="padding:4px 0;">${paymentMethod}</td></tr>
    </table>
    ${giftCardSection}
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
      <span style="font-size:20px;font-weight:700;color:#1a1a1a;margin-left:8px;">EUR${totalAmount}</span>
    </div>
    <div style="background:#f4f3ef;padding:16px;border-radius:8px;margin-top:20px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:6px;">Delivery Details</div>
      <table style="width:100%;font-size:13px;">
        <tr><td style="padding:2px 0;color:#999;width:80px;">Method:</td><td style="padding:2px 0;color:#333;">Digital</td></tr>
        <tr><td style="padding:2px 0;color:#999;">To:</td><td style="padding:2px 0;color:#333;">${customerEmail}</td></tr>
        <tr><td style="padding:2px 0;color:#999;">Time:</td><td style="padding:2px 0;color:#333;">${orderDate}</td></tr>
      </table>
    </div>
  </div>
  <div style="background:#1a1a1a;padding:28px 32px;text-align:center;">
    <p style="color:#c9a96e;font-size:14px;letter-spacing:3px;margin:0 0 8px;text-transform:uppercase;">Parfumistry</p>
    <p style="color:#666;font-size:11px;margin:0;">&copy; ${year} Parfumistry. All rights reserved.</p>
  </div>
</div>
</body></html>`;
}

async function sendEmail(to: string | string[], subject: string, htmlContent: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");

  const payload: Record<string, unknown> = {
    from: "Parfumistry Orders <orders@parfumistry.net>",
    to: Array.isArray(to) ? to : [to],
    subject,
    html: htmlContent,
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error("Resend API error (" + res.status + "): " + errBody);
  }
}


async function sendConfirmationViaFunction(
  supabaseUrl: string,
  customerEmail: string,
  customerName: string,
  items: OrderItem[],
  totalAmount: string,
  shippingAddress: { line1?: string; city?: string; postalCode?: string; country?: string },
  orderNumber?: number | null,
  paymentMethod?: string,
): Promise<void> {
  const url = supabaseUrl + "/functions/v1/send-order-confirmation";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + Deno.env.get("SUPABASE_ANON_KEY")!,
    },
    body: JSON.stringify({
      orderItems: items,
      customerEmail,
      customerName,
      shippingAddress,
      totalAmount,
      orderNumber,
      paymentMethod,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error("send-order-confirmation error: " + errBody);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("id");
    const token = url.searchParams.get("token");
    const action = url.searchParams.get("action");

    if (!orderId || !token || !action || (action !== "approve" && action !== "reject" && action !== "reject_order_number" && action !== "relay_split")) {
      return new Response(buildResultPage("Invalid Link", "Missing or invalid parameters.", false), {
        headers: { "Content-Type": "text/html" }, status: 400,
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
      return new Response(buildResultPage("Invalid Link", "This link is invalid or has already been used.", false), {
        headers: { "Content-Type": "text/html" }, status: 404,
      });
    }

    // Email approve/reject links are SINGLE USE. Once an order has been
    // approved or rejected (by any means), the email buttons are locked.
    // Re-approving or re-rejecting can only be done from the admin panel.
    if (order.status === "approved" || order.status === "rejected") {
      const already = order.status === "approved" ? "approved" : "rejected";
      return new Response(
        buildResultPage(
          "Action Locked",
          `This order has already been ${already}. The email buttons are single-use — any further changes must be made from the admin panel.`,
          false,
        ),
        { headers: { "Content-Type": "text/html" }, status: 200 },
      );
    }

    if (action === "relay_split" || action === "approve") {
      // Atomic check-and-update to prevent duplicate invoices
      const { data: updated, error: updateErr } = await supabase
        .from("orders")
        .update({ status: "approved", email_sent: true, updated_at: new Date().toISOString() })
        .eq("id", orderId)
        .eq("email_sent", false)
        .select("id")
        .maybeSingle();

      if (!updated) {
        return new Response(buildResultPage("Already Approved", "This order has already been approved and the confirmation email was sent.", true), {
          headers: { "Content-Type": "text/html" }, status: 200,
        });
      }

      const items = (order.order_items as unknown as OrderItem[]) || [];

      // Check email validity via Resend before sending
      let emailWarning = "";
      try {
        await sendConfirmationViaFunction(
          supabaseUrl,
          order.customer_email,
          order.customer_name || "Valued Customer",
          items,
          order.total_amount.toString(),
          (order.shipping_address as any) || {},
          order.order_number,
          undefined,
        );
      } catch (emailErr: any) {
        console.error("Failed to send customer email:", emailErr);
        emailWarning = `⚠️ WARNING: The customer email (${order.customer_email}) may be invalid or unreachable. The confirmation email could not be delivered. Error: ${emailErr.message}`;
      }

      // Send admin invoice (only once — this block only runs on first approval)
      const isGiftCard = order.checkout_reference?.startsWith("rewarble");
      const pmLabel = isGiftCard ? "Rewarble (Verified)" : "Revolut Transfer (Verified)";
      const giftCardCode = isGiftCard ? order.checkout_reference?.replace("rewarble-", "") : undefined;
      const invoiceHtml = buildAdminInvoiceHtml(
        order.customer_name || "Valued Customer",
        order.customer_email,
        items,
        order.total_amount.toString(),
        (order.shipping_address as any) || {},
        pmLabel,
        giftCardCode,
      );
      const orderNumLabel = order.order_number ? ` #${order.order_number}` : "";
      const invoiceSubject = (emailWarning ? "⚠️ EMAIL ISSUE — " : "") + "Invoice" + orderNumLabel + ": " + (order.customer_name || order.customer_email) + " - EUR" + order.total_amount;
      
      // If there was an email warning, prepend it to the invoice HTML
      let finalInvoiceHtml = invoiceHtml;
      if (emailWarning) {
        const warningBanner = `<div style="background:#fef2f2;border:2px solid #dc2626;padding:16px 20px;margin:16px 40px;border-radius:8px;">
          <p style="color:#dc2626;font-size:14px;font-weight:600;margin:0 0 6px;">⚠️ Email Delivery Issue</p>
          <p style="color:#991b1b;font-size:13px;margin:0;">The customer email <strong>${order.customer_email}</strong> appears to be invalid or unreachable. The confirmation email may not have been delivered. Please contact the customer directly.</p>
        </div>`;
        finalInvoiceHtml = invoiceHtml.replace('<!-- Invoice Meta -->', warningBanner + '\n  <!-- Invoice Meta -->');
        // Fallback if comment not found
        if (!finalInvoiceHtml.includes('Email Delivery Issue')) {
          finalInvoiceHtml = invoiceHtml.replace('<div style="padding:28px 40px 0', warningBanner + '<div style="padding:28px 40px 0');
        }
      }
      
      await sendEmail(ADMIN_EMAILS, invoiceSubject, finalInvoiceHtml);

      console.log("Order approved, customer email + admin invoice sent:", orderId);

      // Relay 50/50: credit half to the bancontact live counter now, schedule the
      // second half +1h via bancontact_orders (timer-tick will pay it out).
      let relayMsg = "";
      if (action === "relay_split") {
        const nowIso = new Date().toISOString();
        const dueIso = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        const relayToken = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");
        const { error: bcErr } = await supabase.from("bancontact_orders").insert({
          customer_name: order.customer_name || "Valued Customer",
          customer_email: order.customer_email,
          country: (order.shipping_address as any)?.country || null,
          order_items: items,
          total_amount: order.total_amount,
          status: "split",
          approval_token: relayToken,
          source: "checkout_relay",
          split_first_at: nowIso,
          split_second_due_at: dueIso,
        });
        if (bcErr) {
          console.error("Failed to insert relay split row:", bcErr);
          relayMsg = " ⚠️ Counter relay failed: " + bcErr.message;
        } else {
          await supabase.from("bancontact_live_counter").update({ updated_at: nowIso }).eq("id", 1);
          const half = (Number(order.total_amount) / 2).toFixed(2);
          relayMsg = ` Relay 50/50 active: €${half} credited now, €${half} in 1 hour.`;
        }
      }

      const resultMsg = (emailWarning
        ? "Order approved. ⚠️ However, the customer email (" + order.customer_email + ") may be invalid — the confirmation email might not have been delivered."
        : "The confirmation email has been sent to " + order.customer_email + ".") + relayMsg;

      const title = action === "relay_split" ? "Order Approved (Relay 50/50)" : "Order Approved";
      return new Response(buildResultPage(title, resultMsg, true), {
        headers: { "Content-Type": "text/html" },
        status: 200,
      });
    } else {
      // Prevent duplicate rejection
      if (order.status === "rejected") {
        return new Response(buildResultPage("Already Rejected", "This order has already been rejected.", false), {
          headers: { "Content-Type": "text/html" }, status: 200,
        });
      }

      const isGiftCard = order.checkout_reference?.startsWith("rewarble");
      const isBankTransferRej = order.checkout_reference?.startsWith("bank-transfer");
      const isOrderNumReject = action === "reject_order_number";

      const customerName = order.customer_name || "Valued Customer";
      const orderNumber = order.order_number;
      let rejectionHtml: string;
      let notesForDb: string | null = null;

      if (isOrderNumReject) {
        // Mirror admin-orders "order_number" rejection email exactly
        notesForDb = "Customer provided Rewarble order number instead of gift card code (rejected via email).";
        const reason = "It looks like you provided the <strong>Rewarble order number</strong> instead of the <strong>gift card code</strong>. The order number is a number starting with <strong>#</strong> (e.g. #123456) and is <strong>not</strong> what we need.<br><br>The actual gift card code is <strong>16 characters long</strong> and contains <strong>letters and numbers</strong>, for example: <strong style=\"font-family:monospace;background:#f3f4f6;padding:2px 6px;border-radius:4px;\">9YVMBH7H4CXHCX7J</strong>.<br><br><div style=\"background:#f9fafb;border:1px solid #e5e7eb;padding:16px 20px;border-radius:8px;margin:12px 0;\"><div style=\"font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#1a1a1a;font-weight:600;margin-bottom:10px;\">How to find your real code</div><ol style=\"margin:0;padding-left:20px;font-size:14px;color:#333;line-height:1.7;\"><li>Open the <strong>confirmation email</strong> you received from the place where you bought the gift card.</li><li>Click the <strong>\u201CGet Order\u201D</strong> button in that email \u2014 it will take you to their website.</li><li>On that page, press <strong>\u201CDisplay Key\u201D</strong> (or \u201CReveal Code\u201D).</li><li>The 16-character code that appears is your <strong>gift card code</strong> \u2014 that\u2019s what we need.</li></ol></div>Please place a new order and enter the correct gift card code. Your current order has been cancelled.";
        const nextStep = "Please try again or contact us for assistance.";
        rejectionHtml = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f3ef;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#1a1a1a;padding:36px 32px;text-align:center;">
    <h1 style="color:#c9a96e;font-size:26px;font-weight:300;letter-spacing:5px;margin:0;">PARFUMISTRY</h1>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 16px;">Payment Not Received</h2>
    ${orderNumber ? `<p style="font-size:13px;color:#999;margin:0 0 12px;">Order Number: <strong style="color:#1a1a1a;">#${orderNumber}</strong></p>` : ""}
    <p style="font-size:15px;color:#333;">Hi <strong>${escapeHtml(customerName)}</strong>,</p>
    <p style="font-size:14px;color:#666;line-height:1.6;">${reason}</p>
    <p style="font-size:14px;color:#666;line-height:1.6;">${nextStep}</p>
    <div style="background:#faf9f6;border:1px solid #eee;padding:20px 24px;border-radius:8px;text-align:center;margin-top:24px;">
      <p style="font-size:13px;color:#666;margin:0;">Need help? Contact us at <a href="mailto:support@parfumistry.net" style="color:#c9a96e;">support@parfumistry.net</a>${orderNumber ? '<br><span style="font-size:12px;color:#999;">Please include your order number: <strong>#' + orderNumber + '</strong></span>' : ''}</p>
    </div>
  </div>
</div></body></html>`;
      } else {
        rejectionHtml = buildRejectionEmailHtml(customerName, isGiftCard, orderNumber, isBankTransferRej);
      }

      await supabase.from("orders").update({ status: "rejected", rejection_notes: notesForDb, updated_at: new Date().toISOString() }).eq("id", orderId);

      const rejSubject = orderNumber ? `Order #${orderNumber} Update - Parfumistry` : "Order Update - Parfumistry";

      let rejEmailWarning = "";
      try {
        await sendEmail(order.customer_email, rejSubject, rejectionHtml);
      } catch (emailErr: any) {
        console.error("Failed to send rejection email:", emailErr);
        rejEmailWarning = ` ⚠️ Note: The rejection email to ${order.customer_email} may not have been delivered (email might be invalid).`;
      }

      console.log("Order rejected and customer notified:", orderId, "variant:", action);

      const successTitle = isOrderNumReject ? "Order Rejected (Order Number Provided)" : "Order Rejected";
      return new Response(buildResultPage(successTitle, "A rejection notification has been sent to " + order.customer_email + "." + rejEmailWarning, false), {
        headers: { "Content-Type": "text/html" },
        status: 200,
      });
    }
  } catch (error) {
    console.error("Error handling order action:", error);
    return new Response(buildResultPage("Error", "Something went wrong. Please try again.", false), {
      headers: { "Content-Type": "text/html" },
      status: 500,
    });
  }
});
