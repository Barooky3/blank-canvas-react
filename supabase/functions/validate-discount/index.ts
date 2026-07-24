const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Source of truth for discount codes. Kept server-side only.
const VALID_DISCOUNT_CODES: Record<string, number> = {
  'professor15': 15,
  'parfum10': 10,
  'parfumz20': 20,
  'parfumo30': 30,
  'parfuma90': 90,
  'parfumz50': 50,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string" || code.length > 64) {
      return new Response(JSON.stringify({ valid: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    const normalized = code.trim().toLowerCase();
    const percent = VALID_DISCOUNT_CODES[normalized];
    if (!percent) {
      return new Response(JSON.stringify({ valid: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    return new Response(JSON.stringify({ valid: true, percent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("validate-discount error:", e);
    return new Response(JSON.stringify({ valid: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
