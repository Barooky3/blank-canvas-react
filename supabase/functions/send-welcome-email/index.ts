import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require an authenticated user (prevents abuse / branded phishing)
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: authError } = await authClient.auth.getUser();
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, name } = await req.json();
    if (!email || !name) throw new Error("Email and name are required");

    // Only allow sending the welcome email to the authenticated user's own address
    if ((userData.user.email || "").toLowerCase() !== String(email).toLowerCase()) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email))) throw new Error("Invalid email");
    const safeName = escapeHtml(String(name).slice(0, 100));

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) throw new Error("RESEND_API_KEY not configured");

    const year = new Date().getFullYear();

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f3ef;font-family:Helvetica Neue,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">

  <div style="background:#1a1a1a;padding:36px 32px;text-align:center;">
    <h1 style="color:#c9a96e;font-size:26px;font-weight:300;letter-spacing:5px;margin:0;text-transform:uppercase;">Parfumistry</h1>
    <p style="color:#666;font-size:12px;letter-spacing:2px;margin:8px 0 0;text-transform:uppercase;">Premium Fragrances</p>
  </div>

  <div style="background:linear-gradient(135deg,#c9a96e 0%,#b8944f 100%);padding:28px 32px;text-align:center;">
    <h2 style="color:#fff;font-size:22px;font-weight:400;margin:0;letter-spacing:1px;">Welcome, ${safeName}!</h2>
  </div>

  <div style="padding:32px;">
    <p style="font-size:16px;color:#333;line-height:1.6;margin:0 0 16px;">Hi <strong>${safeName}</strong>,</p>
    <p style="font-size:14px;color:#666;line-height:1.7;margin:0 0 16px;">Thanks for creating an account with us. You now have access to our full collection of premium fragrances at competitive prices.</p>
    <p style="font-size:14px;color:#666;line-height:1.7;margin:0 0 24px;">As a welcome gift, here's a discount for your first order:</p>

    <div style="background:#1a1a1a;padding:24px;border-radius:8px;text-align:center;margin-bottom:24px;">
      <p style="color:#c9a96e;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">Your Discount Code</p>
      <div style="background:#c9a96e;display:inline-block;padding:10px 28px;border-radius:6px;margin-bottom:12px;">
        <span style="font-size:28px;font-weight:700;letter-spacing:4px;color:#1a1a1a;">Professor15</span>
      </div>
      <p style="color:#fff;font-size:16px;font-weight:600;margin:8px 0 0;">15% OFF your first order</p>
    </div>

    <p style="font-size:14px;color:#666;line-height:1.7;margin:0 0 16px;">Enter <strong>Professor15</strong> at checkout to apply your discount.</p>

    <div style="text-align:center;margin:24px 0;">
      <a href="https://parfumistry.net/shop" style="display:inline-block;background:#1a1a1a;color:#c9a96e;padding:14px 36px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;letter-spacing:1px;text-transform:uppercase;">Browse Collection</a>
    </div>

    <div style="background:#faf9f6;border:1px solid #eee;padding:20px 24px;border-radius:8px;text-align:center;margin-top:24px;">
      <p style="font-size:13px;color:#666;margin:0;line-height:1.6;">Questions? Reach us at<br>
      <a href="mailto:support@parfumistry.net" style="color:#c9a96e;text-decoration:none;font-weight:500;">support@parfumistry.net</a></p>
    </div>
  </div>

  <div style="background:#1a1a1a;padding:28px 32px;text-align:center;">
    <p style="color:#c9a96e;font-size:14px;letter-spacing:3px;margin:0 0 8px;text-transform:uppercase;">Parfumistry</p>
    <p style="color:#666;font-size:11px;margin:0;">&copy; ${year} Parfumistry. All rights reserved.</p>
  </div>

</div>
</body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Parfumistry <orders@parfumistry.net>",
        to: [email],
        subject: "Welcome to Parfumistry — Here's 15% Off Your First Order",
        html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Resend API error:", res.status, errBody);
      throw new Error("Email provider error");
    }

    console.log("Welcome email sent to:", email);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: "Unable to send welcome email" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
