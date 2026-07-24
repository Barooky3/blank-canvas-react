import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_DISCOUNT_CODES: Record<string, number> = {
  'professor15': 15,
  'parfum10': 10,
  'parfumz20': 20,
  'parfumo30': 30,
  'parfuma90': 90,
  'parfumz50': 50,
};

interface CheckoutRequest {
  amount: number;
  description: string;
  customerEmail: string;
  customerName: string;
  checkoutReference: string;
  redirectUrl?: string;
  orderItems: any[];
  shippingAddress: any;
  discountCode?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("SUMUP_API_KEY");
    if (!apiKey) throw new Error("SumUp API key not configured");

    // Get merchant code from SumUp profile
    const profileRes = await fetch("https://api.sumup.com/v0.1/me", {
      method: "GET",
      headers: { "Authorization": "Bearer " + apiKey },
    });
    const profileBody = await profileRes.text();
    if (!profileRes.ok) throw new Error("SumUp profile failed (" + profileRes.status + "): " + profileBody);

    const profile = JSON.parse(profileBody);
    const merchantCode = profile.merchant_profile?.merchant_code;
    if (!merchantCode) throw new Error("Could not determine merchant code");

    const body = (await req.json()) as CheckoutRequest;
    const { amount, description, customerEmail, customerName, checkoutReference, redirectUrl, orderItems, shippingAddress, discountCode } = body;
    const discountPercent = VALID_DISCOUNT_CODES[discountCode?.toLowerCase().trim() || ''] ?? 0;

    if (!amount || amount <= 0) throw new Error("Invalid amount");
    if (!checkoutReference) throw new Error("Missing checkout reference");

    const checkoutBody: Record<string, unknown> = {
      checkout_reference: checkoutReference,
      amount,
      currency: "EUR",
      merchant_code: merchantCode,
      description: description || "Prof Parfums Order",
      pay_to_email: customerEmail || undefined,
      redirect_url: redirectUrl || undefined,
    };

    const checkoutRes = await fetch("https://api.sumup.com/v0.1/checkouts", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutBody),
    });

    const checkoutData = await checkoutRes.json();
    if (!checkoutRes.ok) {
      throw new Error(checkoutData.message || checkoutData.error_message || "Failed to create SumUp checkout");
    }

    console.log("Checkout created:", checkoutData.id);

    // Store order in database for reliable email sending
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase.from("orders").insert({
      checkout_reference: checkoutReference,
      sumup_checkout_id: checkoutData.id,
      customer_email: customerEmail,
      customer_name: customerName || "Valued Customer",
      shipping_address: shippingAddress || {},
      order_items: orderItems || [],
      total_amount: amount,
      discount_code: discountCode || null,
      discount_percent: discountPercent || 0,
      status: "pending",
      email_sent: false,
    });

    if (dbError) {
      console.error("Failed to store order:", dbError);
      // Don't fail the checkout if DB insert fails, just log it
    } else {
      console.log("Order stored in database for checkout:", checkoutReference);
    }

    return new Response(
      JSON.stringify({ checkoutId: checkoutData.id, amount: checkoutData.amount }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating SumUp checkout:", error);
    return new Response(
      JSON.stringify({ error: "Unable to create checkout" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
