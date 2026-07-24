import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = ["ewhz3384@gmail.com", "elkhabirmalik@gmail.com"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify JWT signature via Supabase Auth
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const adminEmail = user.email || "";
    if (!ADMIN_EMAILS.includes(adminEmail)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, email, reason } = await req.json();

    if (action === "ban") {
      const { error } = await supabase
        .from("banned_users")
        .upsert({ email: email.toLowerCase(), banned_by: adminEmail, reason: reason || null }, { onConflict: "email" });

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    if (action === "unban") {
      const { error } = await supabase
        .from("banned_users")
        .delete()
        .eq("email", email.toLowerCase());

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    if (action === "check") {
      const { data } = await supabase
        .from("banned_users")
        .select("email, created_at")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      return new Response(JSON.stringify({ banned: !!data }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    console.error("Ban user error:", err);
    return new Response(JSON.stringify({ error: "Unable to process request" }), { status: 500, headers: corsHeaders });
  }
});
