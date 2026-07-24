import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAILS = ["ewhz3384@gmail.com", "elkhabirmalik@gmail.com"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === "POST") {
      const body = await req.json();
      const {
        sessionId,
        currentPage,
        cartItems,
        cartTotal,
        isInCheckout,
        country,
        city,
        region,
        deviceType,
        browser,
        os,
        screenWidth,
        referrer,
        pagesViewed,
        userEmail,
      } = body;

      if (!sessionId) {
        return new Response(JSON.stringify({ error: "Missing sessionId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Skip tracking for admin accounts
      if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
        return new Response(JSON.stringify({ ok: true, skipped: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Upsert session
      await adminClient.from("visitor_sessions").upsert(
        {
          session_id: sessionId,
          current_page: currentPage || "/",
          cart_items: cartItems || [],
          cart_total: cartTotal || 0,
          is_in_checkout: isInCheckout || false,
          country: country || null,
          city: city || null,
          region: region || null,
          device_type: deviceType || null,
          browser: browser || null,
          os: os || null,
          screen_width: screenWidth || null,
          referrer: referrer || null,
          pages_viewed: pagesViewed || [],
          user_email: userEmail || null,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "session_id" }
      );

      // Cleanup: delete sessions older than 1 hour (batch, non-blocking)
      adminClient
        .from("visitor_sessions")
        .delete()
        .lt("last_seen_at", new Date(Date.now() - 3600000).toISOString())
        .then(() => {});

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      // Admin: fetch active sessions (last 45 seconds)
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const token = authHeader.replace("Bearer ", "");

      // Verify JWT signature via Supabase Auth
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: { user }, error: authError } = await authClient.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!ADMIN_EMAILS.includes(user.email || "")) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const cutoff = new Date(Date.now() - 45000).toISOString();
      const { data, error } = await adminClient
        .from("visitor_sessions")
        .select("*")
        .gte("last_seen_at", cutoff)
        .order("last_seen_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ sessions: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Track visitor error:", error);
    return new Response(JSON.stringify({ error: "Unable to process request" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
