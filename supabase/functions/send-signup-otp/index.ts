import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendEmail(to: string, subject: string, htmlContent: string): Promise<void> {
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
      to: [to],
      subject,
      html: htmlContent,
    }),
  });

  const resBody = await res.text();
  console.log("Resend response status:", res.status, "body:", resBody);
  if (!res.ok) {
    throw new Error("Resend API error (" + res.status + "): " + resBody);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name } = await req.json();

    if (!email || !name) {
      throw new Error("Email and name are required");
    }

    // Input validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error("Invalid email format");
    if (String(name).length > 100) throw new Error("Name too long");

    function escapeHtml(text: string): string {
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    const safeName = escapeHtml(String(name));
    const code = String(Math.floor(100000 + Math.random() * 900000));

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("email_otps").delete().eq("email", email).eq("used", false);

    const { error: insertError } = await supabase.from("email_otps").insert({ email, code });
    if (insertError) throw new Error("Failed to store verification code");

    const html = [
      '<!DOCTYPE html><html><head><meta charset="utf-8"></head>',
      '<body style="margin:0;padding:0;background-color:#f4f3ef;font-family:Helvetica Neue,Arial,sans-serif;">',
      '<div style="max-width:600px;margin:0 auto;background-color:#ffffff;">',
      '<div style="background-color:#1a1a1a;padding:36px 32px;text-align:center;">',
      '<h1 style="color:#c9a96e;font-size:26px;font-weight:300;letter-spacing:5px;margin:0;text-transform:uppercase;">Parfumistry</h1>',
      '</div>',
      '<div style="padding:40px 32px;text-align:center;">',
      '<h2 style="color:#1a1a1a;font-size:22px;font-weight:400;margin:0 0 16px 0;">Welcome, ' + safeName + '!</h2>',
      '<p style="color:#666;font-size:14px;margin:0 0 32px 0;line-height:1.6;">Enter this code on the website to verify your account:</p>',
      '<div style="background-color:#f8f7f4;border:2px solid #c9a96e;border-radius:8px;padding:24px;display:inline-block;">',
      '<span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#1a1a1a;">' + code + '</span>',
      '</div>',
      '<p style="color:#999;font-size:12px;margin:24px 0 0 0;">This code expires in 10 minutes.</p>',
      '</div>',
      '<div style="background-color:#1a1a1a;padding:24px 32px;text-align:center;">',
      '<p style="color:#666;font-size:11px;margin:0;">&copy; ' + new Date().getFullYear() + ' Parfumistry</p>',
      '</div>',
      '</div></body></html>',
    ].join("\n");

    await sendEmail(email, "Your Verification Code - Parfumistry", html);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return new Response(
      JSON.stringify({ error: "Unable to send verification code" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
