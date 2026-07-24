import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const POPUP_SAMPLES = {
  code_invalid: "Unfortunately, the Rewarble code you provided could not be verified. The code appears to be invalid, fake, or already used. Please make sure you sent the actual gift card code — it is 16 characters long and contains letters and numbers (e.g. 9YVMBH7H4CXHCX7J). Your order has been cancelled.",
  value_mismatch: "Code value: €15.00 | Cart value: €24.99 | Missing: €9.99",
  order_number: "It looks like you provided the Rewarble order number instead of the gift card code. The order number starts with # (e.g. #123456) and is not what we need. The actual gift card code is 16 characters long (e.g. 9YVMBH7H4CXHCX7J). You can find your gift card code in the confirmation email you received from the place where you purchased the card. Please place a new order with the correct code.",
};

const PopupPreview = ({ reason, orderNumber }: { reason: string; orderNumber: string }) => (
  <div className="relative w-full max-w-md mx-auto bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
    <div className="h-1.5 bg-red-500" />
    <button className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground">
      <X className="h-4 w-4" />
    </button>
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Order #{orderNumber} Rejected</h3>
          <p className="text-xs text-muted-foreground">We couldn't process your order</p>
        </div>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5">
        <p className="text-sm text-red-800 leading-relaxed">{reason}</p>
      </div>
      <div className="flex items-center justify-end">
        <button className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground">Got it</button>
      </div>
    </div>
  </div>
);

const EmailPreview = () => {
  const year = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState<string>("confirmation");

  const rejectionWrapper = (reason: string, nextStep: string, adminNotes?: string) => `
<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#f4f3ef;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#1a1a1a;padding:36px 32px;text-align:center;">
    <h1 style="color:#c9a96e;font-size:26px;font-weight:300;letter-spacing:5px;margin:0;">PARFUMISTRY</h1>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 16px;">Payment Not Received</h2>
    <p style="font-size:13px;color:#999;margin:0 0 12px;">Order Number: <strong style="color:#1a1a1a;">#1042</strong></p>
    <p style="font-size:15px;color:#333;">Hi <strong>John</strong>,</p>
    <p style="font-size:14px;color:#666;line-height:1.6;">${reason}</p>
    ${adminNotes || ""}
    <p style="font-size:14px;color:#666;line-height:1.6;">${nextStep}</p>
    <div style="background:#faf9f6;border:1px solid #eee;padding:20px 24px;border-radius:8px;text-align:center;margin-top:24px;">
      <p style="font-size:13px;color:#666;margin:0;">Need help? Contact us at <a href="mailto:support@parfumistry.net" style="color:#c9a96e;">support@parfumistry.net</a></p>
    </div>
  </div>
</div></body></html>`;

  const confirmationHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;background:#f4f3ef;font-family:Helvetica Neue,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
<div style="background:#1a1a1a;padding:36px 32px;text-align:center;">
<h1 style="color:#c9a96e;font-size:26px;font-weight:300;letter-spacing:5px;margin:0;text-transform:uppercase;">Parfumistry</h1>
<p style="color:#666;font-size:12px;letter-spacing:2px;margin:8px 0 0;text-transform:uppercase;">Premium Fragrances</p>
</div>
<div style="background:linear-gradient(135deg,#c9a96e 0%,#b8944f 100%);padding:28px 32px;text-align:center;">
<h2 style="color:#fff;font-size:22px;font-weight:400;margin:0;letter-spacing:1px;">Your Order Has Been Confirmed! 🎉</h2>
</div>
<div style="background:#1a1a1a;padding:28px 32px;text-align:center;border-bottom:3px solid #c9a96e;">
<h2 style="color:#c9a96e;font-size:22px;font-weight:600;margin:0 0 6px;letter-spacing:1px;">Thank you for your purchase!</h2>
<h2 style="color:#fff;font-size:20px;font-weight:600;margin:0 0 14px;">🎁 Special Offer!</h2>
<p style="color:#fff;font-size:16px;margin:0 0 6px;line-height:1.5;">Use code <span style="background:#c9a96e;color:#1a1a1a;padding:3px 10px;border-radius:4px;font-weight:700;font-size:18px;letter-spacing:1px;">Parfumz50</span> for <strong>50% off</strong> your next order</p>
</div>
<div style="padding:32px 32px 0;">
<p style="font-size:13px;color:#999;margin:0 0 8px;">Order Number: <strong style="color:#1a1a1a;font-size:15px;">#1042</strong></p>
<p style="font-size:15px;color:#333;margin:0 0 6px;line-height:1.6;">Hi <strong>John</strong>,</p>
<div style="background:#faf9f6;border:2px solid #c9a96e;padding:16px 24px;border-radius:8px;text-align:center;margin-bottom:24px;">
<p style="font-size:16px;color:#1a1a1a;margin:0;font-weight:500;line-height:1.6;">📦 Your order has been confirmed and is being prepared for shipment.</p>
</div>
</div>
<div style="padding:0 32px;">
<div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#999;padding-bottom:12px;border-bottom:2px solid #1a1a1a;">Your Products</div>
<table style="width:100%;border-collapse:collapse;"><tbody>
<tr><td style="padding:16px 0;border-bottom:1px solid #eee;vertical-align:top;">
<table cellpadding="0" cellspacing="0" border="0"><tr>
<td style="padding-left:16px;vertical-align:top;">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin-bottom:4px;">Dior</div>
<div style="font-size:15px;font-weight:500;color:#1a1a1a;margin-bottom:4px;">Sauvage Parfum — 50ml</div>
<div style="font-size:13px;color:#666;">Qty: 1 · €32.00</div>
</td></tr></table>
</td></tr>
</tbody></table></div>
<div style="padding:20px 32px;margin:0 32px;border-top:2px solid #1a1a1a;text-align:right;">
<span style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#999;">Total Paid: </span>
<span style="font-size:22px;font-weight:600;color:#1a1a1a;">€32.00</span>
</div>
<div style="background:#1a1a1a;padding:28px 32px;text-align:center;">
<p style="color:#c9a96e;font-size:14px;letter-spacing:3px;margin:0 0 8px;text-transform:uppercase;">Parfumistry</p>
<p style="color:#666;font-size:11px;margin:0;line-height:1.8;">© ${year} Parfumistry. All rights reserved.</p>
</div>
</div></body></html>`;

  const rejectInvalidHtml = rejectionWrapper(
    'Unfortunately, the Rewarble code you provided could not be verified. The code appears to be <strong>invalid, fake, or already used</strong>. Please make sure you sent the <strong>actual gift card code</strong> — it is <strong>16 characters long and contains letters and numbers</strong>. It should look something like this: <strong style="font-family:monospace;background:#f3f4f6;padding:2px 6px;border-radius:4px;">9YVMBH7H4CXHCX7J</strong>. The Rewarble <strong>order number</strong> (only digits, starting with #) is <strong>not</strong> the gift card code. Your order has been cancelled.',
    "Please try again or contact us for assistance."
  );

  const rejectMismatchHtml = rejectionWrapper(
    'Unfortunately, the value of the Rewarble gift card you provided <strong>does not match your cart total</strong>.<br><br><div style="background:#fef3c7;border:1px solid #f59e0b;padding:12px 16px;border-radius:8px;margin:8px 0;font-size:14px;">Code value: <strong>€15.00</strong><br>Cart value: <strong>€24.99</strong><br>Missing amount: <strong>€9.99</strong></div><br>To complete your purchase, please <strong>redo your order using two codes</strong>: the <strong>same code</strong> you already used, plus a <strong>new Rewarble gift card</strong> to cover the missing amount. The code you should use to cover the difference is a <strong>€10 Rewarble gift card</strong>. Your current order has been cancelled.',
    "Once you have both codes ready, simply place a new order on our website and enter both gift card codes."
  );

  const rejectOrderNumberHtml = rejectionWrapper(
    'It looks like you provided the <strong>Rewarble order number</strong> instead of the <strong>gift card code</strong>. The order number is a number starting with <strong>#</strong> (e.g. #123456) and is <strong>not</strong> what we need.<br><br>The actual gift card code is <strong>16 characters long</strong> and contains <strong>letters and numbers</strong>, for example: <strong style="font-family:monospace;background:#f3f4f6;padding:2px 6px;border-radius:4px;">9YVMBH7H4CXHCX7J</strong>.<br><br>Please place a new order and enter the correct gift card code. Your current order has been cancelled.',
    "Please try again or contact us for assistance."
  );

  const tabs = [
    { key: "confirmation", label: "✅ Confirmation", type: "email" },
    { key: "reject_invalid", label: "❌ Code Invalid", type: "email" },
    { key: "reject_mismatch", label: "💰 Value Mismatch", type: "email" },
    { key: "reject_order_number", label: "🔢 Order Number", type: "email" },
    { key: "popup_invalid", label: "🔔 Popup: Invalid", type: "popup" },
    { key: "popup_mismatch", label: "🔔 Popup: Mismatch", type: "popup" },
    { key: "popup_order_number", label: "🔔 Popup: Order #", type: "popup" },
  ];

  const emailMap: Record<string, string> = {
    confirmation: confirmationHtml,
    reject_invalid: rejectInvalidHtml,
    reject_mismatch: rejectMismatchHtml,
    reject_order_number: rejectOrderNumberHtml,
  };

  const isPopup = activeTab.startsWith("popup_");

  return (
    <div className="min-h-screen bg-muted p-4">
      <div className="max-w-[650px] mx-auto">
        <h1 className="font-display text-2xl text-foreground mb-4 text-center">Email & Popup Preview</h1>
        <p className="text-sm text-muted-foreground text-center mb-2">Preview how each email and in-app popup looks to customers.</p>
        
        <p className="text-xs text-muted-foreground text-center mb-1 mt-4 uppercase tracking-wider">Emails</p>
        <div className="flex flex-wrap gap-2 justify-center mb-2">
          {tabs.filter(t => t.type === "email").map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-input hover:bg-accent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mb-1 mt-3 uppercase tracking-wider">In-App Popups</p>
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {tabs.filter(t => t.type === "popup").map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-input hover:bg-accent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isPopup ? (
          <div className="py-8">
            <PopupPreview
              orderNumber="1042"
              reason={
                activeTab === "popup_invalid" ? POPUP_SAMPLES.code_invalid :
                activeTab === "popup_mismatch" ? POPUP_SAMPLES.value_mismatch :
                POPUP_SAMPLES.order_number
              }
            />
          </div>
        ) : (
          <div 
            className="rounded-lg overflow-hidden shadow-xl"
            dangerouslySetInnerHTML={{ __html: emailMap[activeTab] || "" }} 
          />
        )}
      </div>
    </div>
  );
};

export default EmailPreview;