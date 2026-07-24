import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, orderNumber, skipHistory } = await req.json();

    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const rawNum = typeof orderNumber === "string" || typeof orderNumber === "number"
      ? String(orderNumber).trim().replace(/^#/, "")
      : "";
    const numericOrder = parseInt(rawNum, 10);

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || isNaN(numericOrder)) {
      return new Response(
        JSON.stringify({ error: "Please provide a valid email and order number." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: order, error } = await supabase
      .from("orders")
      .select("order_number, customer_email, status, created_at")
      .eq("order_number", numericOrder)
      .ilike("customer_email", cleanEmail)
      .maybeSingle();

    if (error) {
      console.error("track-order query error:", error);
      return new Response(
        JSON.stringify({ error: "Could not look up the order. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const matched = !!order;
    const ipHint = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    if (!skipHistory) {
      await supabase.from("tracking_lookups").insert({
        email: cleanEmail,
        order_number: numericOrder,
        matched,
        ip_hint: ipHint,
      });
    }

    if (!matched) {
      return new Response(
        JSON.stringify({ matched: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        matched: true,
        order: {
          order_number: order.order_number,
          status: order.status,
          created_at: order.created_at,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("track-order error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
