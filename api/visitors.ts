import { adminDb, json, preflight, requireAdmin, clean } from "./_lib/contact.js";

// Live visitor tracking.
//   POST /api/visitors { sessionId, ... }        -> heartbeat (upsert, real IP geo from Vercel)
//   POST /api/visitors { sessionId, leave:true } -> visitor closed the page (sendBeacon)
//   GET  /api/visitors (admin bearer)            -> active sessions + last-hour stats

export const ACTIVE_WINDOW_MS = 75_000;
const RETENTION_MS = 60 * 60_000;

const ADMIN_EMAILS = ["ewhz3384@gmail.com", "elkhabirmalik@gmail.com"];
const BOT_UA =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|vercel-screenshot/i;

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

function geoFrom(req: Request) {
  const code = req.headers.get("x-vercel-ip-country") || "";
  const rawCity = req.headers.get("x-vercel-ip-city") || "";
  const region = req.headers.get("x-vercel-ip-country-region") || "";
  let country: string | null = null;
  if (code) {
    try { country = regionNames.of(code.toUpperCase()) || code; } catch { country = code; }
  }
  let city: string | null = null;
  if (rawCity) {
    try { city = decodeURIComponent(rawCity); } catch { city = rawCity; }
  }
  return { country, city, region: region || null };
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return preflight();
  const db = adminDb();

  if (req.method === "POST") {
    let body: Record<string, unknown>;
    try { body = JSON.parse(await req.text()); } catch { return json({ error: "Bad JSON" }, 400); }

    const sessionId = clean(body.sessionId, 64);
    if (!sessionId) return json({ error: "Missing sessionId" }, 400);

    if (body.leave === true) {
      await db.from("visitor_sessions").delete().eq("session_id", sessionId);
      return json({ ok: true });
    }

    const ua = req.headers.get("user-agent") || "";
    const userEmail = clean(body.userEmail, 200).toLowerCase() || null;
    if (BOT_UA.test(ua) || (userEmail && ADMIN_EMAILS.includes(userEmail))) {
      return json({ ok: true, skipped: true });
    }

    const pages = Array.isArray(body.pagesViewed)
      ? (body.pagesViewed as unknown[]).filter((p): p is string => typeof p === "string").slice(0, 100)
      : [];

    const { data: existing } = await db
      .from("visitor_sessions")
      .select("pages_viewed, country, city, region")
      .eq("session_id", sessionId)
      .maybeSingle();

    const mergedPages = Array.from(new Set([...(existing?.pages_viewed || []), ...pages])).slice(0, 200);
    const geo = geoFrom(req);
    const cartItems = Array.isArray(body.cartItems) ? (body.cartItems as unknown[]).slice(0, 50) : [];
    const currentPage = clean(body.currentPage, 300) || "/";

    const { error } = await db.from("visitor_sessions").upsert(
      {
        session_id: sessionId,
        current_page: currentPage,
        cart_items: cartItems,
        cart_total: Number(body.cartTotal) || 0,
        is_in_checkout: currentPage === "/checkout",
        country: geo.country ?? existing?.country ?? null,
        city: geo.city ?? existing?.city ?? null,
        region: geo.region ?? existing?.region ?? null,
        device_type: clean(body.deviceType, 20) || null,
        browser: clean(body.browser, 40) || null,
        os: clean(body.os, 40) || null,
        screen_width: Number(body.screenWidth) || null,
        referrer: clean(body.referrer, 500) || null,
        pages_viewed: mergedPages,
        user_email: userEmail,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "session_id" },
    );
    if (error) return json({ error: error.message }, 500);

    await db
      .from("visitor_sessions")
      .delete()
      .lt("last_seen_at", new Date(Date.now() - RETENTION_MS).toISOString());

    return json({ ok: true });
  }

  if (req.method === "GET") {
    const admin = await requireAdmin(req);
    if (!admin) return json({ error: "Unauthorized" }, 401);

    const now = Date.now();
    const { data, error } = await db
      .from("visitor_sessions")
      .select("*")
      .gte("last_seen_at", new Date(now - RETENTION_MS).toISOString())
      .order("last_seen_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);

    const all = data || [];
    const cutoff = now - ACTIVE_WINDOW_MS;
    const sessions = all.filter((s) => new Date(s.last_seen_at).getTime() >= cutoff);

    return json({
      sessions,
      lastHourVisitors: all.length,
      serverTime: new Date(now).toISOString(),
      activeWindowSeconds: ACTIVE_WINDOW_MS / 1000,
    });
  }

  return json({ error: "Method not allowed" }, 405);
}

export default { fetch: handler };
