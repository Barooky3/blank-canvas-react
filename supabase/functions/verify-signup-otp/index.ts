import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, password, name } = await req.json();

    if (!email || !code || !password || !name) {
      throw new Error("Email, code, password and name are required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find valid OTP
    const { data: otpRecord, error: fetchError } = await supabase
      .from("email_otps")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    await supabase
      .from("email_otps")
      .update({ used: true })
      .eq("id", otpRecord.id);

    // Create the user with admin API (auto-confirmed)
    let userId: string | undefined;
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (createError) {
      // If user already exists, try to update their password instead
      if (createError.message?.includes("already been registered")) {
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users?.users?.find((u: any) => u.email === email);
        if (existingUser) {
          const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
            password,
            email_confirm: true,
            user_metadata: { full_name: name },
          });
          if (updateError) {
            console.error("updateUserById error:", updateError);
            return new Response(
              JSON.stringify({ error: "Unable to process registration" }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
            );
          }
          userId = existingUser.id;
        } else {
          return new Response(
              JSON.stringify({ error: "Unable to process registration" }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
            );
        }
      } else {
        console.error("createUser error:", createError);
        return new Response(
          JSON.stringify({ error: "Unable to process registration" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    } else {
      userId = userData.user?.id;
    }

    return new Response(
      JSON.stringify({ success: true, userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return new Response(
      JSON.stringify({ error: "Unable to verify code" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
