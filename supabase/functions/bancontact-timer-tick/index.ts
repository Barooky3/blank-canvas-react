// Runs once a minute via pg_cron. Two responsibilities:
// 1. If the timed generator is enabled and next_send_at has passed, fire a
//    random bancontact order and schedule the next one based on mode.
// 2. Credit any split-second-half payouts whose split_second_due_at has passed.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODE_RANGES: Record<string, [number, number]> = {
  hyper_aggressive: [1, 5],
  aggressive: [10, 20],
  hard: [20, 45],
  normal: [40, 60],
  relaxed: [65, 90],
  hyper_relaxed: [95, 120],
};

function nextDelayMinutes(mode: string): number {
  const [min, max] = MODE_RANGES[mode] || MODE_RANGES.normal;
  return min + Math.random() * (max - min);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    let actions = { generated: false, splitPaid: 0, autoApproved: 0 };

    // 0) Auto-approve pending bancontact orders 1–5 minutes after creation.
    // Per-order delay derived deterministically from the UUID so each order
    // gets its own stable 1–5 minute target.
    const { data: pendings } = await supabase
      .from("bancontact_orders")
      .select("id, created_at")
      .eq("status", "pending");
    if (pendings && pendings.length > 0) {
      const dueIds: string[] = [];
      for (const row of pendings as any[]) {
        const created = new Date(row.created_at).getTime();
        // Hash first 8 hex chars of UUID -> 0..1 -> 1..5 minutes
        const hex = String(row.id).replace(/-/g, "").slice(0, 8);
        const frac = parseInt(hex, 16) / 0xffffffff;
        const delayMs = (1 + frac * 4) * 60 * 1000;
        if (created + delayMs <= now.getTime()) dueIds.push(row.id);
      }
      if (dueIds.length > 0) {
        const { error: appErr } = await supabase
          .from("bancontact_orders")
          .update({
            status: "approved",
            approved_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .in("id", dueIds);
        if (!appErr) {
          actions.autoApproved = dueIds.length;
          await supabase.from("bancontact_live_counter").update({ updated_at: now.toISOString() }).eq("id", 1);
        }
      }
    }

    // 1) Pay out due split-second halves
    const { data: dueSplits } = await supabase
      .from("bancontact_orders")
      .select("id")
      .eq("status", "split")
      .is("split_second_at", null)
      .lte("split_second_due_at", now.toISOString());
    if (dueSplits && dueSplits.length > 0) {
      const ids = dueSplits.map((r: any) => r.id);
      const { error: updErr } = await supabase
        .from("bancontact_orders")
        .update({ split_second_at: now.toISOString(), updated_at: now.toISOString() })
        .in("id", ids);
      if (!updErr) {
        actions.splitPaid = ids.length;
        // Touch the counter so it recalculates + realtime fires
        await supabase.from("bancontact_live_counter").update({ updated_at: now.toISOString() }).eq("id", 1);
      }
    }

    // 2) Timed generator
    const { data: state } = await supabase
      .from("bancontact_timer_state")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (state?.enabled) {
      const dueAt = state.next_send_at ? new Date(state.next_send_at) : null;
      const shouldFire = !dueAt || dueAt <= now;
      if (shouldFire) {
        // Fire a random bancontact order
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/bancontact-generate`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              mode: "random",
              source: "timed",
              // 90% draw from the seed pool, 10% from history.
              customerSource: Math.random() < 0.9 ? "seed" : "history",
            }),
          });
          actions.generated = res.ok;
        } catch (e) {
          console.error("Failed to invoke bancontact-generate from tick:", e);
        }
        const delayMin = nextDelayMinutes(state.mode);
        const next = new Date(now.getTime() + delayMin * 60 * 1000);
        await supabase.from("bancontact_timer_state").update({
          last_send_at: now.toISOString(),
          next_send_at: next.toISOString(),
          updated_at: now.toISOString(),
        }).eq("id", 1);
      } else if (!state.next_send_at) {
        // Safety: if enabled but no next_send_at, set one
        const delayMin = nextDelayMinutes(state.mode);
        const next = new Date(now.getTime() + delayMin * 60 * 1000);
        await supabase.from("bancontact_timer_state").update({
          next_send_at: next.toISOString(),
          updated_at: now.toISOString(),
        }).eq("id", 1);
      }
    }

    return new Response(JSON.stringify({ success: true, ...actions, at: now.toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (e: any) {
    console.error("bancontact-timer-tick error:", e);
    return new Response(JSON.stringify({ error: e.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
