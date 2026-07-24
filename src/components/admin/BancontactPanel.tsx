import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import { RefreshCw, ChevronDown, Trash2, Plus, Zap, Settings2, ChevronsUpDown, X } from "lucide-react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { products as CATALOG } from "@/data/products";
import { applyPriceOverride, fetchAllProductPriceOverrides } from "@/hooks/useProductPrice";

const PRIMARY_ADMIN = "ewhz3384@gmail.com";
const BANCONTACT_ADMIN = "elkhabirmalik@gmail.com";
const ADMIN_EMAILS = [PRIMARY_ADMIN, BANCONTACT_ADMIN];
const DEFAULT_ANCHOR = "2020-01-01T00:00:00.000Z";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

type ContribOrder = {
  id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  credit: number;
  kind: string;
  method: string;
  approvedAt: string;
};
type HistoryEntry = {
  id: string;
  resetAt: string;
  periodStart: string;
  periodEnd: string;
  gross: number;
  adSpend: number;
  net: number;
  count: number;
  orders?: ContribOrder[];
};
type Snapshot = { gross: number; count: number; net: number; orders: ContribOrder[]; adSpend: number; resetAt: string; history: HistoryEntry[] };

type CustomItem = { productId?: string; brand: string; name: string; price: number; quantity: number; selectedMl?: number };
type ShippingChoice = "none" | "standard" | "express";
const SHIPPING_COSTS: Record<ShippingChoice, number> = { none: 0, standard: 3.99, express: 12.99 };

const TIMER_MODES: { value: string; label: string; range: string; min: number; max: number }[] = [
  { value: "hyper_aggressive", label: "Hyper Aggressive", range: "1–5 min", min: 1, max: 5 },
  { value: "aggressive", label: "Aggressive", range: "10–20 min", min: 10, max: 20 },
  { value: "hard", label: "Hard", range: "20–45 min", min: 20, max: 45 },
  { value: "normal", label: "Normal", range: "40–60 min", min: 40, max: 60 },
  { value: "relaxed", label: "Relaxed", range: "65–90 min", min: 65, max: 90 },
  { value: "hyper_relaxed", label: "Hyper Relaxed", range: "95–120 min", min: 95, max: 120 },
];

async function invokeFn(name: string, body: any) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session?.access_token ?? ""}`,
      "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
  return json;
}

interface Props {
  userEmail: string;
}

export default function BancontactPanel({ userEmail }: Props) {
  const isPrimary = userEmail === PRIMARY_ADMIN;
  const isAdmin = ADMIN_EMAILS.includes(userEmail);

  const [snapshot, setSnapshot] = useState<Snapshot>({
    gross: 0, count: 0, net: 0, orders: [], adSpend: 0, resetAt: DEFAULT_ANCHOR, history: [],
  });
  const [liveOrdersOpen, setLiveOrdersOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});

  const [adSpendDialogOpen, setAdSpendDialogOpen] = useState(false);
  const [adSpendInput, setAdSpendInput] = useState("");

  const [timer, setTimer] = useState<{ enabled: boolean; mode: string; nextAt: string | null; lastAt: string | null }>({
    enabled: false, mode: "normal", nextAt: null, lastAt: null,
  });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const [customOpen, setCustomOpen] = useState(false);
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [customShipping, setCustomShipping] = useState<ShippingChoice>("standard");
  const [customTotal, setCustomTotal] = useState<string>("");
  const [customSource, setCustomSource] = useState<"seed" | "history">("seed");
  const [busy, setBusy] = useState(false);

  const isBancontactAdmin = userEmail === BANCONTACT_ADMIN;
  const [pendingBC, setPendingBC] = useState<any[]>([]);
  const [pendingBCLoading, setPendingBCLoading] = useState(false);
  const [pendingBCOpen, setPendingBCOpen] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchPendingBancontact = useCallback(async () => {
    if (!isAdmin) return;
    setPendingBCLoading(true);
    try {
      const { data, error } = await supabase
        .from("bancontact_orders")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPendingBC(data || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load pending Bancontact orders");
    } finally {
      setPendingBCLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchPendingBancontact();
    const ch = supabase
      .channel("bancontact_pending_orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "bancontact_orders" }, () => fetchPendingBancontact())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin, fetchPendingBancontact]);

  const handlePendingAction = useCallback(async (order: any, action: "approve" | "reject" | "relay_split") => {
    if (!order?.approval_token) { toast.error("Missing approval token"); return; }
    if (action === "reject" && !confirm(`Reject Bancontact order from ${order.customer_name}?`)) return;
    setActingId(order.id);
    try {
      const fnAction = action === "relay_split" ? "split" : action;
      const url = `${SUPABASE_URL}/functions/v1/bancontact-action?id=${order.id}&token=${order.approval_token}&action=${fnAction}`;
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) throw new Error(`Action failed (${res.status})`);
      toast.success(
        action === "approve" ? "Bancontact order approved" :
        action === "reject" ? "Bancontact order rejected" :
        "Relay 50/50 started"
      );
      setPendingBC((prev) => prev.filter((o) => o.id !== order.id));
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setActingId(null);
    }
  }, []);

  // Hydrate price overrides so catalog reflects live prices
  useEffect(() => { fetchAllProductPriceOverrides(); }, []);
  const catalog = useMemo(() => CATALOG.map(applyPriceOverride), []);

  const itemsSubtotal = useMemo(
    () => customItems.reduce((s, it) => s + (Number(it.price) || 0) * Math.max(1, Math.floor(Number(it.quantity) || 1)), 0),
    [customItems]
  );
  const autoTotal = useMemo(
    () => Math.round((itemsSubtotal + SHIPPING_COSTS[customShipping]) * 100) / 100,
    [itemsSubtotal, customShipping]
  );

  const applyCounterRow = useCallback((row: any) => {
    if (!row) return;
    const gross = Number(row.gross) || 0;
    const adSpend = Number(row.ad_spend) || 0;
    setSnapshot({
      gross,
      adSpend,
      net: Number(row.net ?? gross - adSpend) || 0,
      count: Number(row.order_count) || 0,
      orders: Array.isArray(row.contributing_orders) ? row.contributing_orders : [],
      resetAt: row.reset_at || DEFAULT_ANCHOR,
      history: Array.isArray(row.reset_history) ? row.reset_history : [],
    });
  }, []);

  const applyTimerRow = useCallback((row: any) => {
    if (!row) return;
    setTimer({
      enabled: !!row.enabled,
      mode: row.mode || "normal",
      nextAt: row.next_send_at || null,
      lastAt: row.last_send_at || null,
    });
  }, []);

  // Hydrate + subscribe
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      const [c, t] = await Promise.all([
        supabase.from("bancontact_live_counter").select("*").eq("id", 1).maybeSingle(),
        supabase.from("bancontact_timer_state").select("*").eq("id", 1).maybeSingle(),
      ]);
      if (cancelled) return;
      if (c.data) applyCounterRow(c.data);
      if (t.data) applyTimerRow(t.data);
    })();
    const ch = supabase
      .channel("bancontact_sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "bancontact_live_counter" }, (p) => applyCounterRow((p as any).new))
      .on("postgres_changes", { event: "*", schema: "public", table: "bancontact_timer_state" }, (p) => applyTimerRow((p as any).new))
      .on("postgres_changes", { event: "*", schema: "public", table: "bancontact_orders" }, async () => {
        // Order changes (approve/reject/split/cron) refresh the counter via DB trigger;
        // re-fetch as a safety net.
        const { data } = await supabase.from("bancontact_live_counter").select("*").eq("id", 1).maybeSingle();
        if (data) applyCounterRow(data);
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [isAdmin, applyCounterRow, applyTimerRow]);

  const persistCounter = useCallback(async (patch: Partial<{ adSpend: number; resetAt: string; history: HistoryEntry[] }>) => {
    const next = {
      id: 1,
      ad_spend: patch.adSpend ?? snapshot.adSpend,
      reset_at: patch.resetAt ?? snapshot.resetAt,
      reset_history: patch.history ?? snapshot.history,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from("bancontact_live_counter").upsert(next).select("*").maybeSingle();
    if (error) { toast.error("Failed to save Bancontact tally"); return; }
    if (data) applyCounterRow(data);
  }, [snapshot, applyCounterRow]);

  const persistTimer = useCallback(async (patch: Partial<{ enabled: boolean; mode: string; nextAt: string | null }>) => {
    const next = {
      id: 1,
      enabled: patch.enabled ?? timer.enabled,
      mode: patch.mode ?? timer.mode,
      next_send_at: patch.nextAt === undefined ? timer.nextAt : patch.nextAt,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from("bancontact_timer_state").upsert(next).select("*").maybeSingle();
    if (error) { toast.error("Failed to save timer state"); return; }
    if (data) applyTimerRow(data);
  }, [timer, applyTimerRow]);

  const handleGenerate = async (mode: "random" | "custom", payload?: any) => {
    setBusy(true);
    try {
      const res = await invokeFn("bancontact-generate", { mode, ...payload });
      const srcLabel = payload?.customerSource === "history" ? " [history]" : payload?.customerSource === "seed" ? " [seed]" : "";
      toast.success(`Bancontact order sent${srcLabel} (€${Number(res.total).toFixed(2)} — ${res.customer})`);
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setBusy(false);
    }
  };

  const handleBulkGenerate = async (count: number, customerSource: "seed" | "history") => {
    setBusy(true);
    let ok = 0;
    let fail = 0;
    for (let i = 0; i < count; i++) {
      try {
        await invokeFn("bancontact-generate", { mode: "random", customerSource });
        ok++;
      } catch (e: any) {
        fail++;
      }
    }
    setBusy(false);
    if (fail === 0) toast.success(`Generated ${ok} Bancontact orders [${customerSource}]`);
    else toast.error(`Generated ${ok}/${count} — ${fail} failed`);
  };

  const handleCustomSubmit = async () => {
    const cleaned = customItems
      .map((i) => ({ ...i, price: Number(i.price) || 0, quantity: Math.max(1, Math.floor(Number(i.quantity) || 1)) }))
      .filter((i) => i.name && i.brand && i.price > 0);
    if (cleaned.length === 0) { toast.error("Add at least one item"); return; }
    const overrideNum = customTotal.trim() ? Number(customTotal) : NaN;
    const totalToSend = isFinite(overrideNum) && overrideNum > 0 ? overrideNum : autoTotal;
    await handleGenerate("custom", { items: cleaned, total: totalToSend, customerSource: customSource });
    setCustomOpen(false);
  };

  const toggleTimer = async (on: boolean) => {
    if (on) {
      // Set initial next_send_at ~1 minute out so user sees countdown immediately;
      // tick will reschedule on each fire based on mode.
      const next = new Date(Date.now() + 60_000).toISOString();
      await persistTimer({ enabled: true, nextAt: next });
      toast.success(`Timed generator ON — ${TIMER_MODES.find(m => m.value === timer.mode)?.label}`);
    } else {
      await persistTimer({ enabled: false, nextAt: null });
      toast.success("Timed generator OFF");
    }
  };

  const handleResetDay = () => {
    if (!confirm("Reset Bancontact live tally and ad spend?")) return;
    const now = new Date().toISOString();
    const nextHistory: HistoryEntry[] = [
      {
        id: now,
        resetAt: now,
        periodStart: snapshot.resetAt,
        periodEnd: now,
        gross: snapshot.gross,
        adSpend: snapshot.adSpend,
        net: snapshot.net,
        count: snapshot.count,
        orders: snapshot.orders,
      },
      ...snapshot.history,
    ].slice(0, 200);
    persistCounter({ resetAt: now, adSpend: 0, history: nextHistory });
  };

  const countdown = useMemo(() => {
    if (!timer.enabled || !timer.nextAt) return null;
    const ms = new Date(timer.nextAt).getTime() - Date.now();
    if (ms <= 0) return "any moment";
    return formatDistanceToNowStrict(new Date(timer.nextAt), { addSuffix: true });
    // tick keeps this recalculating every second
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.enabled, timer.nextAt, tick]);

  if (!isAdmin) return null;

  return (
    <div className="mb-6 border rounded-lg p-4 bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            Live Counter — Bancontact
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Since {format(new Date(snapshot.resetAt), "dd MMM yyyy, HH:mm")} · {snapshot.count} credited entries
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isPrimary && (
            <>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => handleGenerate("random", { customerSource: "seed" })} disabled={busy}>
                <Zap className="h-3 w-3 mr-1" /> Generate (Seed Names)
              </Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => handleGenerate("random", { customerSource: "history" })} disabled={busy}>
                <Zap className="h-3 w-3 mr-1" /> Generate (History Names)
              </Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => handleBulkGenerate(5, "seed")} disabled={busy}>
                <Zap className="h-3 w-3 mr-1" /> Bulk x5 (Seed)
              </Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => handleBulkGenerate(5, "history")} disabled={busy}>
                <Zap className="h-3 w-3 mr-1" /> Bulk x5 (History)
              </Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => handleBulkGenerate(15, "seed")} disabled={busy}>
                <Zap className="h-3 w-3 mr-1" /> Bulk x15 (Seed)
              </Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => handleBulkGenerate(15, "history")} disabled={busy}>
                <Zap className="h-3 w-3 mr-1" /> Bulk x15 (History)
              </Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setCustomOpen(true)} disabled={busy}>
                <Plus className="h-3 w-3 mr-1" /> Custom Bancontact Order
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" className="text-xs" onClick={() => { setAdSpendInput(""); setAdSpendDialogOpen(true); }}>
            Ad Budget
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={handleResetDay}>
            <RefreshCw className="h-3 w-3 mr-1" /> Reset Day
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 items-end">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Gross</p>
          <p className="text-sm font-semibold">€{snapshot.gross.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Ad Spend</p>
          <p className="text-sm font-semibold text-destructive">−€{snapshot.adSpend.toFixed(2)}</p>
        </div>
        <div className="text-center border-l pl-4">
          <p className="text-xs text-muted-foreground">Net Total</p>
          <p className={`text-lg font-bold ${snapshot.net < 0 ? "text-destructive" : "text-green-500"}`}>
            €{snapshot.net.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Timer panel — primary admin only */}
      {isPrimary && (
        <div className="mt-4 border-t pt-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Timed Bancontact Generator</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={timer.mode} onValueChange={async (v) => {
                const m = TIMER_MODES.find((x) => x.value === v);
                const delayMs = m ? (m.min + Math.random() * (m.max - m.min)) * 60_000 : 60_000;
                await persistTimer({ mode: v, nextAt: timer.enabled ? new Date(Date.now() + delayMs).toISOString() : null });
              }}>
                <SelectTrigger className="h-8 w-[200px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMER_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value} className="text-xs">
                      {m.label} <span className="opacity-60 ml-1">· {m.range}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Switch checked={timer.enabled} onCheckedChange={toggleTimer} />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex flex-wrap gap-4">
            {timer.enabled ? (
              <>
                <span>Next send: <strong className="text-foreground">{timer.nextAt ? format(new Date(timer.nextAt), "HH:mm:ss") : "—"}</strong> {countdown ? <span className="opacity-70">({countdown})</span> : null}</span>
                {timer.lastAt && <span>Last sent: {format(new Date(timer.lastAt), "HH:mm:ss")}</span>}
              </>
            ) : (
              <span className="opacity-70">Off — flip the switch to start auto-generating.</span>
            )}
          </div>
        </div>
      )}

      {/* Pending Bancontact orders — hidden for restricted bancontact admin */}
      {isAdmin && !isBancontactAdmin && (
        <div className="mt-4 border-t pt-3">
          <button onClick={() => setPendingBCOpen(v => !v)} className="w-full flex items-center justify-between text-left hover:bg-muted/30 rounded px-1 py-1 transition-colors">
            <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              Pending Bancontact Orders
              <span className="px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-600 text-[10px] font-semibold">
                {pendingBC.length}
              </span>
              {pendingBCLoading && <RefreshCw className="h-3 w-3 animate-spin opacity-60" />}
            </p>
            <div className="flex items-center gap-2">
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); fetchPendingBancontact(); }}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Refresh
              </span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${pendingBCOpen ? "rotate-180" : ""}`} />
            </div>
          </button>
          {pendingBCOpen && (
            <div className="mt-2 space-y-2 max-h-80 overflow-y-auto">
              {pendingBC.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center">No pending Bancontact orders.</p>
              ) : pendingBC.map((o) => {
                const addr = o.shipping_address || {};
                const addrLine = [addr.line1, addr.city, addr.country].filter(Boolean).join(", ");
                const busyRow = actingId === o.id;
                return (
                  <div key={o.id} className="text-xs border rounded px-3 py-2 bg-background/40">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">#{o.order_number ?? o.id.slice(0,8)}</span>
                          <span className="opacity-80">{o.customer_name}</span>
                          
                        </div>
                        {addrLine && <div className="opacity-60 mt-0.5 truncate">{addrLine}</div>}
                        <div className="opacity-60 mt-0.5">{format(new Date(o.created_at), "dd MMM HH:mm")}</div>
                      </div>
                      <div className="font-semibold">€{Number(o.total_amount).toFixed(2)}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button size="sm" variant="default" className="h-7 text-xs bg-green-600 hover:bg-green-700" disabled={busyRow} onClick={() => handlePendingAction(o, "approve")}>
                        ✓ Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="h-7 text-xs" disabled={busyRow} onClick={() => handlePendingAction(o, "reject")}>
                        ✕ Reject
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busyRow} onClick={() => handlePendingAction(o, "relay_split")}>
                        ⇄ Relay 50/50
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Contributing entries — hidden for restricted bancontact admin */}
      {snapshot.orders.length > 0 && !isBancontactAdmin && (
        <div className="mt-3 border-t pt-2">
          <button onClick={() => setLiveOrdersOpen(v => !v)} className="w-full flex items-center justify-between text-left hover:bg-muted/30 rounded px-1 py-1 transition-colors">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Credited Entries — {snapshot.orders.length}
            </p>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${liveOrdersOpen ? "rotate-180" : ""}`} />
          </button>
          {liveOrdersOpen && (
            <div className="mt-2 pl-4 border-l border-border/60 space-y-1 max-h-64 overflow-y-auto">
              {snapshot.orders.map((o, i) => (
                <div key={`${o.id}-${o.kind}-${i}`} className="flex items-center justify-between gap-2 py-0.5 text-xs">
                  <div className="text-muted-foreground truncate">
                    <span className="font-mono opacity-70">{o.kind === "full" ? "FULL" : o.kind === "split_1" ? "½₁" : "½₂"}</span>
                    <span className="ml-2">{o.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="opacity-60">{format(new Date(o.approvedAt), "HH:mm")}</span>
                    <strong>€{Number(o.credit).toFixed(2)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reset history — hidden for restricted bancontact admin */}
      {!isBancontactAdmin && (
      <div className="mt-4 border-t pt-3">
        <button onClick={() => setHistoryOpen(v => !v)} className="w-full flex items-center justify-between text-left hover:bg-muted/30 rounded px-1 py-1 transition-colors">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Reset History — {snapshot.history.length} {snapshot.history.length === 1 ? "day" : "days"}
          </p>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${historyOpen ? "rotate-180" : ""}`} />
        </button>
        {historyOpen && (
          <div className="mt-2 space-y-1.5 max-h-72 overflow-y-auto">
            {snapshot.history.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">No resets yet.</p>
            ) : (
              snapshot.history.map((h) => {
                const isOpen = !!expandedHistory[h.id];
                const hasOrders = !!(h.orders && h.orders.length > 0);
                return (
                  <div key={h.id} className="text-xs border rounded px-2 py-1.5 bg-background/40">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button type="button" onClick={() => hasOrders && setExpandedHistory(p => ({ ...p, [h.id]: !p[h.id] }))}
                        className={`text-muted-foreground flex items-center gap-1 text-left ${hasOrders ? "hover:text-foreground cursor-pointer" : "cursor-default"}`}>
                        {hasOrders && <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : "-rotate-90"}`} />}
                        <span>{format(new Date(h.periodStart), "dd MMM HH:mm")} → {format(new Date(h.periodEnd), "dd MMM HH:mm")}<span className="ml-2 opacity-70">· {h.count} entries</span></span>
                      </button>
                      <div className="flex gap-3 items-center">
                        <span>Gross <strong>€{Number(h.gross).toFixed(2)}</strong></span>
                        <span className="text-destructive">Ads −€{Number(h.adSpend).toFixed(2)}</span>
                        <span className={Number(h.net) < 0 ? "text-destructive font-semibold" : "text-green-500 font-semibold"}>Net €{Number(h.net).toFixed(2)}</span>
                        <button onClick={() => {
                          if (confirm("Delete this history entry?")) {
                            const nextHistory = snapshot.history.filter(x => x.id !== h.id);
                            persistCounter({ history: nextHistory });
                          }
                        }} className="text-muted-foreground hover:text-destructive" aria-label="Delete entry">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    {isOpen && hasOrders && (
                      <div className="mt-2 pl-4 border-l border-border/60 space-y-1">
                        {h.orders!.map((o, i) => (
                          <div key={`${o.id}-${i}`} className="flex items-center justify-between gap-2 py-0.5">
                            <div className="text-muted-foreground truncate">
                              <span className="ml-2">{o.customer_name}</span>
                              
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="opacity-60">{format(new Date(o.approvedAt), "HH:mm")}</span>
                              <strong>€{Number(o.credit ?? o.total_amount).toFixed(2)}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      )}

      {/* Ad Budget dialog */}
      <Dialog open={adSpendDialogOpen} onOpenChange={setAdSpendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bancontact Ad Budget</DialogTitle>
            <DialogDescription>Add to or reset the ad spend that subtracts from the net total. Current: €{snapshot.adSpend.toFixed(2)}</DialogDescription>
          </DialogHeader>
          <Input type="number" inputMode="decimal" step="0.01" placeholder="Amount (€)" value={adSpendInput} onChange={(e) => setAdSpendInput(e.target.value)} />
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => { persistCounter({ adSpend: 0 }); setAdSpendDialogOpen(false); }}>Reset to €0</Button>
            <Button onClick={() => {
              const amt = parseFloat(adSpendInput);
              if (!isFinite(amt) || amt <= 0) { toast.error("Enter a positive amount"); return; }
              persistCounter({ adSpend: snapshot.adSpend + amt });
              setAdSpendDialogOpen(false);
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom order dialog */}
      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Custom Bancontact Order</DialogTitle>
            <DialogDescription>Pick items from the live catalogue. Total auto-calculates with shipping. Customer is auto-pulled from older real orders.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
            {customItems.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">No items yet — add one below.</p>
            )}
            {customItems.map((it, idx) => {
              const product = it.productId ? catalog.find((p) => p.id === it.productId) : undefined;
              return (
                <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                  <div className="col-span-6">
                    <ProductPickerCombobox
                      catalog={catalog}
                      value={it.productId}
                      onPick={(p) => {
                        const cheapest = p.variants && p.variants.length
                          ? p.variants.reduce((a, b) => (a.price <= b.price ? a : b))
                          : null;
                        setCustomItems((prev) => prev.map((x, i) => i === idx ? {
                          ...x,
                          productId: p.id,
                          brand: p.brand,
                          name: p.name,
                          price: cheapest ? cheapest.price : p.price,
                          selectedMl: cheapest ? cheapest.ml : undefined,
                        } : x));
                      }}
                    />
                  </div>
                  <div className="col-span-3">
                    {product && product.variants && product.variants.length > 0 ? (
                      <Select
                        value={it.selectedMl !== undefined ? String(it.selectedMl) : ""}
                        onValueChange={(v) => {
                          const ml = Number(v);
                          const variant = product.variants?.find((x) => x.ml === ml);
                          setCustomItems((prev) => prev.map((x, i) => i === idx ? {
                            ...x,
                            selectedMl: ml,
                            price: variant ? variant.price : x.price,
                          } : x));
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="ML" /></SelectTrigger>
                        <SelectContent>
                          {product.variants.map((v) => (
                            <SelectItem key={v.ml} value={String(v.ml)} className="text-xs">
                              {v.ml}ml — €{v.price.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input className="h-8 text-xs" type="number" placeholder="ML" value={it.selectedMl ?? ""} onChange={(e) => setCustomItems((p) => p.map((x, i) => i === idx ? { ...x, selectedMl: Number(e.target.value) || undefined } : x))} />
                    )}
                  </div>
                  <Input className="col-span-1 h-8 text-xs" type="number" min={1} placeholder="Qty" value={it.quantity} onChange={(e) => setCustomItems((p) => p.map((x, i) => i === idx ? { ...x, quantity: Number(e.target.value) || 1 } : x))} />
                  <Input className="col-span-2 h-8 text-xs" type="number" step="0.01" placeholder="€" value={it.price} onChange={(e) => setCustomItems((p) => p.map((x, i) => i === idx ? { ...x, price: Number(e.target.value) || 0 } : x))} />
                  <button onClick={() => setCustomItems((p) => p.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive flex justify-center" aria-label="Remove item">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCustomItems((p) => [...p, { brand: "", name: "", price: 0, quantity: 1 }])}>
              <Plus className="h-3 w-3 mr-1" /> Add item
            </Button>
          </div>

          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs text-muted-foreground">Customer source</label>
              <Select value={customSource} onValueChange={(v) => setCustomSource(v as "seed" | "history")}>
                <SelectTrigger className="h-8 w-[220px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="seed" className="text-xs">Seed names</SelectItem>
                  <SelectItem value="history" className="text-xs">History names</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs text-muted-foreground">Shipping</label>
              <Select value={customShipping} onValueChange={(v) => setCustomShipping(v as ShippingChoice)}>
                <SelectTrigger className="h-8 w-[220px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard" className="text-xs">Standard — €3.99</SelectItem>
                  <SelectItem value="express" className="text-xs">Express — €12.99</SelectItem>
                  <SelectItem value="none" className="text-xs">No shipping — €0.00</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Items subtotal</span>
              <span>€{itemsSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Shipping</span>
              <span>€{SHIPPING_COSTS[customShipping].toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold border-t pt-2">
              <span>Auto Total</span>
              <span>€{autoTotal.toFixed(2)}</span>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Override total (optional)</label>
              <Input type="number" step="0.01" placeholder="Leave blank to use auto total" value={customTotal} onChange={(e) => setCustomTotal(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCustomOpen(false)}>Cancel</Button>
            <Button onClick={handleCustomSubmit} disabled={busy}>Send to Bancontact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductPickerCombobox({
  catalog,
  value,
  onPick,
}: {
  catalog: ReturnType<typeof applyPriceOverride>[] | any[];
  value?: string;
  onPick: (p: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? catalog.find((p: any) => p.id === value) : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" size="sm" className="h-8 w-full justify-between text-xs font-normal">
          <span className="truncate">
            {selected ? `${selected.brand} — ${selected.name}` : "Pick product..."}
          </span>
          <ChevronsUpDown className="h-3 w-3 opacity-50 ml-1 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search catalogue..." className="h-9" />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup>
              {catalog.map((p: any) => (
                <CommandItem
                  key={p.id}
                  value={`${p.brand} ${p.name}`}
                  onSelect={() => { onPick(p); setOpen(false); }}
                  className="text-xs"
                >
                  <span className="font-medium mr-1">{p.brand}</span>
                  <span className="opacity-80">{p.name}</span>
                  <span className="ml-auto opacity-60">€{Number(p.price).toFixed(2)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
