import { useEffect, useState, useMemo, useRef, useCallback } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CURRENCIES } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, RefreshCw, Package, Mail, Search, Trash2, Pencil, Plus, CalendarIcon, ImageIcon, ExternalLink, Users, Radio, Ban, BarChart3, Globe, ChevronDown, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import LiveVisitorDashboard from "@/components/admin/LiveVisitorDashboard";
import ReviewsAdmin from "@/components/admin/ReviewsAdmin";
import { startOfDay, endOfDay, subDays, startOfMonth, subMonths, startOfWeek, isWithinInterval, format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { products } from "@/data/products";
import { Product } from "@/types/product";
import BancontactPanel from "@/components/admin/BancontactPanel";

const PRIMARY_ADMIN = "ewhz3384@gmail.com";
const RESTRICTED_ADMIN = "elkhabirmalik@gmail.com";
const ADMIN_EMAILS = [PRIMARY_ADMIN, RESTRICTED_ADMIN];

// State for delete confirmation dialog - replaces native confirm() which breaks when "don't ask again" is checked

interface OrderItem {
  name: string;
  brand: string;
  price: number;
  quantity: number;
  selectedMl?: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  order_items: OrderItem[];
  shipping_address: any;
  checkout_reference: string;
  created_at: string;
  updated_at?: string;
  order_number: number | null;
  approval_token: string | null;
  gift_card_code: string | null;
  discount_code: string | null;
  discount_percent: number | null;
  proof_url: string | null;
  rejection_notes: string | null;
  first_visit_at?: string | null;

}

function getPaymentMethod(ref: string): string {
  if (ref?.startsWith("bancontact")) return "Bancontact";
  if (ref?.startsWith("cod")) return "Cash on Delivery";
  if (ref?.startsWith("rewarble") || ref?.startsWith("paypal") || ref?.startsWith("ideal")) return "Rewarble";
  return "Other";
}

const PAYMENT_METHODS = ["All", "Rewarble", "Bancontact", "Cash on Delivery"];

export default function AdminOrders() {
  const { user, loading: authLoading } = useAuth();
  const isRestrictedAdmin = (user?.email || "").toLowerCase() === RESTRICTED_ADMIN;
  const navigate = useNavigate();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending_approval");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [transitioning, setTransitioning] = useState(false);
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"orders" | "live" | "reviews">("orders");
  const [customerEmailFilter, setCustomerEmailFilter] = useState<string>("");

  // Read URL search params for email/search filter (e.g. from chat link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    const searchParam = params.get("search");
    if (emailParam) {
      setCustomerEmailFilter(emailParam.toLowerCase());
      setStatusFilter("all");
      setActiveTab("orders");
    }
    if (searchParam) {
      setSearchQuery(searchParam);
      setStatusFilter("all");
      setActiveTab("orders");
    }
    if (emailParam || searchParam) {
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const [statsOpen, setStatsOpen] = useState(false);
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [statsTimeFilter, setStatsTimeFilter] = useState<string>("all");

  // Date range for revenue tally
  const [datePreset, setDatePreset] = useState<string>("all");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  // Live counter (Rewarble/iDEAL/PayPal) — synced across admins via
  // public.admin_live_counter (single row id=1). Never auto-resets; only the
  // "Reset Day" button changes the anchor. Defaults to a far-past anchor so
  // all approved orders count until manually reset.
  const LIVE_COUNTER_DEFAULT_ANCHOR = "2020-01-01T00:00:00.000Z";
  const [liveResetAt, setLiveResetAt] = useState<string>(LIVE_COUNTER_DEFAULT_ANCHOR);
  const [adSpend, setAdSpend] = useState<number>(0);
  const [adSpendDialogOpen, setAdSpendDialogOpen] = useState(false);
  const [adSpendInput, setAdSpendInput] = useState("");
  type ResetHistoryOrder = { id: string; order_number: number | null; customer_name: string; customer_email: string; total_amount: number; method: string; approvedAt: string };
  type ResetHistoryEntry = { id: string; resetAt: string; periodStart: string; periodEnd: string; gross: number; adSpend: number; net: number; count: number; orders?: ResetHistoryOrder[] };
  type LiveCounterSnapshot = { gross: number; count: number; net: number; orders: ResetHistoryOrder[] };
  const [resetHistory, setResetHistory] = useState<ResetHistoryEntry[]>([]);
  const [sharedLiveCounter, setSharedLiveCounter] = useState<LiveCounterSnapshot>({ gross: 0, count: 0, net: 0, orders: [] });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [liveOrdersExpanded, setLiveOrdersExpanded] = useState(false);
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Record<string, boolean>>({});
  const liveCounterHydrated = useRef(false);

  const applyLiveCounterRow = useCallback((row: any) => {
    if (!row) return;
    const gross = Number(row.gross) || 0;
    const adSpendValue = Number(row.ad_spend) || 0;
    setLiveResetAt(row.reset_at || LIVE_COUNTER_DEFAULT_ANCHOR);
    setAdSpend(adSpendValue);
    setResetHistory(Array.isArray(row.reset_history) ? row.reset_history : []);
    setSharedLiveCounter({
      gross,
      count: Number(row.order_count) || 0,
      net: Number(row.net ?? gross - adSpendValue) || 0,
      orders: Array.isArray(row.contributing_orders) ? row.contributing_orders : [],
    });
  }, []);

  const persistLiveCounterRow = useCallback(async ({
    resetAt = liveResetAt,
    adSpendValue = adSpend,
    history = resetHistory,
    snapshot = sharedLiveCounter,
  }: {
    resetAt?: string;
    adSpendValue?: number;
    history?: ResetHistoryEntry[];
    snapshot?: LiveCounterSnapshot;
  }) => {
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) return;
    setLiveResetAt(resetAt);
    setAdSpend(adSpendValue);
    setResetHistory(history);
    setSharedLiveCounter(snapshot);
    const { data, error } = await supabase.from("admin_live_counter").upsert({
      id: 1,
      reset_at: resetAt,
      ad_spend: adSpendValue,
      reset_history: history,
      gross: snapshot.gross,
      net: snapshot.net,
      order_count: snapshot.count,
      contributing_orders: snapshot.orders,
      updated_at: new Date().toISOString(),
    }).select("*").maybeSingle();
    if (error) {
      console.error("Failed to sync live counter:", error);
      toast.error("Failed to sync live counter");
    } else if (data) {
      applyLiveCounterRow(data);
    }
  }, [adSpend, applyLiveCounterRow, liveResetAt, resetHistory, sharedLiveCounter, user]);

  const [hassanMarked, setHassanMarked] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try { return new Set(JSON.parse(localStorage.getItem("admin_hassan_marked") || "[]")); } catch { return new Set(); }
  });

  useEffect(() => {
    localStorage.setItem("admin_hassan_marked", JSON.stringify(Array.from(hassanMarked)));
  }, [hassanMarked]);

  // Hydrate live counter from DB + subscribe to realtime cross-admin updates
  useEffect(() => {
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("admin_live_counter").select("*").eq("id", 1).maybeSingle();
      if (cancelled) return;
      if (data) applyLiveCounterRow(data);
      liveCounterHydrated.current = true;
    })();
    const channel = supabase
      .channel("admin_live_counter_sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_live_counter" }, (payload) => {
        applyLiveCounterRow((payload as any).new);
      })
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, applyLiveCounterRow]);


  // Rejection notes state
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [mismatchCodeValue, setMismatchCodeValue] = useState("");
  const [mismatchCartValue, setMismatchCartValue] = useState("");
  const [mismatchCurrency, setMismatchCurrency] = useState("EUR");
  const [customRecommendedCard, setCustomRecommendedCard] = useState("");
  const [recommendedCardCurrency, setRecommendedCardCurrency] = useState("EUR");

  // Revolut rejection state
  const [revolutRejectingOrder, setRevolutRejectingOrder] = useState<Order | null>(null);
  const [revolutRejectMessage, setRevolutRejectMessage] = useState("");
  const [revolutRejectLoading, setRevolutRejectLoading] = useState(false);

  // Edit state
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [catalogueSearch, setCatalogueSearch] = useState("");
  const [showCatalogue, setShowCatalogue] = useState(false);

  // Manual email sender state
  const [manualOpen, setManualOpen] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualItems, setManualItems] = useState<OrderItem[]>([]);
  const [manualCatalogueSearch, setManualCatalogueSearch] = useState("");
  const [manualSending, setManualSending] = useState(false);
  const [bannedEmails, setBannedEmails] = useState<Set<string>>(new Set());
  const [remoteSearchResults, setRemoteSearchResults] = useState<any[]>([]);
  const [remoteSearching, setRemoteSearching] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !ADMIN_EMAILS.includes(user.email || ""))) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const fetchOrders = async (showFullLoading = true) => {
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) return;
    if (showFullLoading) setLoading(true);
    else setTransitioning(true);

    try {
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Try refreshing the session if getSession returns null
        const { data: refreshData } = await supabase.auth.refreshSession();
        session = refreshData?.session ?? null;
      }
      if (!session) {
        toast.error("Session expired. Please log in again.");
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-orders?status=all`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      const json = await res.json();
      if (res.ok) {
        setAllOrders(json.orders || []);
      } else {
        toast.error(json.error || "Failed to fetch orders");
      }
    } catch {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
      setTransitioning(false);
    }
  };

  const fetchBannedUsers = async () => {
    const { data } = await supabase.from('banned_users').select('email');
    if (data) setBannedEmails(new Set(data.map(d => d.email.toLowerCase())));
  };

  useEffect(() => {
    if (ADMIN_EMAILS.includes(user?.email || "")) {
      fetchOrders(true);
      fetchBannedUsers();
    }
  }, [user]);

  // Remote search for orders not in the local set
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query || query.length < 2) {
      setRemoteSearchResults([]);
      return;
    }
    const isNumericSearch = /^\d+$/.test(query);
    
    // Check if we already have matching results locally
    const hasLocalResults = allOrders.some(o => {
      if (isNumericSearch) {
        return o.order_number && o.order_number.toString().includes(query);
      }
      const q = query.toLowerCase();
      return o.customer_name.toLowerCase().includes(q) || o.customer_email.toLowerCase().includes(q);
    });
    
    if (hasLocalResults) {
      setRemoteSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setRemoteSearching(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const param = isNumericSearch ? `order_number=${query}` : `search_text=${encodeURIComponent(query)}`;
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-orders?${param}`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );
        const json = await res.json();
        if (res.ok && json.orders?.length) {
          setRemoteSearchResults(json.orders.filter((ro: any) => !allOrders.some(lo => lo.id === ro.id)));
        } else {
          setRemoteSearchResults([]);
        }
      } catch {
        setRemoteSearchResults([]);
      } finally {
        setRemoteSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, allOrders]);

  const handleBanToggle = async (email: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const isBanned = bannedEmails.has(email.toLowerCase());
    const action = isBanned ? "unban" : "ban";
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ban-user`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ action, email }),
        }
      );
      if (res.ok) {
        toast.success(isBanned ? `Unbanned ${email}` : `Banned ${email}`);
        fetchBannedUsers();
      } else {
        const json = await res.json();
        toast.error(json.error || "Failed");
      }
    } catch {
      toast.error("Failed to update ban status");
    }
  };

  // Compute order count per email for repeat customer detection
  const emailOrderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of allOrders) {
      const email = o.customer_email.toLowerCase();
      counts[email] = (counts[email] || 0) + 1;
    }
    return counts;
  }, [allOrders]);

  // Compute date range from preset or custom
  const dateRange = useMemo<{ from: Date; to: Date } | null>(() => {
    const now = new Date();

    // "Day start" = 1:00 AM Bulgarian time (UTC+2 winter / UTC+3 summer).
    // We approximate with a fixed UTC+3 offset (EET is +2, EEST is +3; most of the year is EEST).
    const bulgarianDayStart = (ref: Date) => {
      // Convert ref to Bulgarian time, floor to date, set hour to 1, convert back to UTC
      const bgOffset = 3; // UTC+3 (EEST – covers Mar-Oct; winter is +2, close enough)
      const bgTime = new Date(ref.getTime() + bgOffset * 3600000);
      const bgDay = new Date(Date.UTC(bgTime.getUTCFullYear(), bgTime.getUTCMonth(), bgTime.getUTCDate(), 1, 0, 0, 0));
      // If bgTime is before 1 AM Bulgarian, the "day" actually started the previous calendar day at 1 AM
      if (bgTime.getUTCHours() < 1) {
        bgDay.setUTCDate(bgDay.getUTCDate() - 1);
      }
      // Convert back from Bulgarian to UTC
      return new Date(bgDay.getTime() - bgOffset * 3600000);
    };

    const dayStart = (ref: Date) => bulgarianDayStart(ref);
    const dayEnd = (ref: Date) => {
      const start = dayStart(ref);
      return new Date(start.getTime() + 24 * 3600000 - 1);
    };

    switch (datePreset) {
      case "today": return { from: dayStart(now), to: dayEnd(now) };
      case "yesterday": return { from: dayStart(subDays(now, 1)), to: dayEnd(subDays(now, 1)) };
      case "7days": return { from: dayStart(subDays(now, 6)), to: dayEnd(now) };
      case "30days": return { from: dayStart(subDays(now, 29)), to: dayEnd(now) };
      case "this_month": return { from: startOfMonth(now), to: dayEnd(now) };
      case "last_month": { const lm = subMonths(now, 1); return { from: startOfMonth(lm), to: dayEnd(subDays(startOfMonth(now), 1)) }; }
      case "this_week": return { from: startOfWeek(now, { weekStartsOn: 1 }), to: dayEnd(now) };
      case "custom": return customFrom && customTo ? { from: dayStart(customFrom), to: dayEnd(customTo) } : null;
      default: return null; // "all"
    }
  }, [datePreset, customFrom, customTo]);

  const approvedOrders = useMemo(
    () => allOrders.filter((o) => o.status === "approved"),
    [allOrders],
  );

  const buildLiveCounterSnapshot = useCallback((ordersSource: Order[], resetAt: string, adSpendValue: number): LiveCounterSnapshot => {
    const resetDate = new Date(resetAt);
    let gross = 0;
    let count = 0;
    const orders: ResetHistoryOrder[] = [];
    for (const o of ordersSource) {
      if (o.status !== "approved") continue;
      const ref = o.checkout_reference || "";
      if (!ref.startsWith("rewarble")) continue;
      const approvedAt = new Date(o.updated_at || o.created_at);
      if (approvedAt < resetDate) continue;
      gross += o.total_amount;
      count++;
      orders.push({
        id: o.id,
        order_number: o.order_number ?? null,
        customer_name: o.customer_name,
        customer_email: o.customer_email,
        total_amount: o.total_amount,
        method: getPaymentMethod(ref),
        approvedAt: (o.updated_at || o.created_at) as string,
      });
    }
    orders.sort((a, b) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime());
    return { gross, count, net: gross - adSpendValue, orders };
  }, []);

  // Personal custom tally — ONLY for primary admin (ewhz3384@gmail.com).
  // Fully manual: not affected by approved orders. Add/subtract values freely.
  const isPrimaryAdmin = (user?.email || "").toLowerCase() === PRIMARY_ADMIN;

  interface PersonalAdj {
    amount: number;
    timestamp: string;
  }

  const [personalAdjustments, setPersonalAdjustments] = useState<PersonalAdj[]>([]);
  const [personalResetAt, setPersonalResetAt] = useState<string>(new Date().toISOString());
  const [personalTallyHydrated, setPersonalTallyHydrated] = useState(false);
  const [adjustInput, setAdjustInput] = useState<string>("");
  const personalTotal = useMemo(() => {
    return Math.round(personalAdjustments.reduce((sum, a) => sum + a.amount, 0) * 100) / 100;
  }, [personalAdjustments]);

  const applyPersonalAdjustment = (delta: number) => {
    setPersonalAdjustments((prev) => {
      const next = [...prev, { amount: delta, timestamp: new Date().toISOString() }];
      return next;
    });
  };

  // Hydrate personal tally from DB (cross-device sync)
  useEffect(() => {
    if (!isPrimaryAdmin || !user?.email) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await (supabase as any)
        .from("admin_personal_tallies")
        .select("*")
        .eq("admin_email", user.email)
        .maybeSingle();
      if (cancelled) return;
      if (data && !error) {
        setPersonalAdjustments(Array.isArray(data.adjustments) ? data.adjustments : []);
        setPersonalResetAt(data.reset_at || new Date().toISOString());
      } else {
        // Seed from legacy localStorage once if present
        try {
          const legacyAdj = JSON.parse(localStorage.getItem("admin_personal_rewarble_adjustments") || "[]");
          const legacyReset = localStorage.getItem("admin_personal_rewarble_reset_at") || new Date().toISOString();
          if (Array.isArray(legacyAdj) && legacyAdj.length > 0) {
            setPersonalAdjustments(legacyAdj);
            setPersonalResetAt(legacyReset);
          }
        } catch {}
      }
      setPersonalTallyHydrated(true);
    })();
    return () => { cancelled = true; };
  }, [isPrimaryAdmin, user]);

  // Persist personal tally to DB whenever it changes
  useEffect(() => {
    if (!isPrimaryAdmin || !user?.email || !personalTallyHydrated) return;
    (async () => {
      await (supabase as any).from("admin_personal_tallies").upsert({
        admin_email: user.email,
        adjustments: personalAdjustments,
        reset_at: personalResetAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: "admin_email" });
    })();
  }, [personalAdjustments, personalResetAt, isPrimaryAdmin, user, personalTallyHydrated]);

  // Revenue tally from approved orders filtered by date
  const revenueTally = useMemo(() => {
    const byMethod: Record<string, number> = {};
    let total = 0;
    let count = 0;
    for (const o of approvedOrders) {
      if (dateRange) {
        const d = new Date(o.created_at);
        if (!isWithinInterval(d, { start: dateRange.from, end: dateRange.to })) continue;
      }
      const pm = getPaymentMethod(o.checkout_reference);
      byMethod[pm] = (byMethod[pm] || 0) + o.total_amount;
      total += o.total_amount;
      count++;
    }
    return { byMethod, total, count };
  }, [approvedOrders, dateRange]);

  const liveCounter = sharedLiveCounter;

  // Order statistics by country with time filter
  const countryStats = useMemo(() => {
    const now = new Date();
    const bgOffset = 3;
    const bulgarianDayStart = (ref: Date) => {
      const bgTime = new Date(ref.getTime() + bgOffset * 3600000);
      const bgDay = new Date(Date.UTC(bgTime.getUTCFullYear(), bgTime.getUTCMonth(), bgTime.getUTCDate(), 1, 0, 0, 0));
      if (bgTime.getUTCHours() < 1) bgDay.setUTCDate(bgDay.getUTCDate() - 1);
      return new Date(bgDay.getTime() - bgOffset * 3600000);
    };
    const dayEnd = (ref: Date) => new Date(bulgarianDayStart(ref).getTime() + 24 * 3600000 - 1);

    let statsRange: { from: Date; to: Date } | null = null;
    switch (statsTimeFilter) {
      case "today": statsRange = { from: bulgarianDayStart(now), to: dayEnd(now) }; break;
      case "yesterday": statsRange = { from: bulgarianDayStart(subDays(now, 1)), to: dayEnd(subDays(now, 1)) }; break;
      case "7days": statsRange = { from: bulgarianDayStart(subDays(now, 6)), to: dayEnd(now) }; break;
      case "last_month": { const lm = subMonths(now, 1); statsRange = { from: startOfMonth(lm), to: dayEnd(subDays(startOfMonth(now), 1)) }; break; }
      default: statsRange = null;
    }

    const byCountry: Record<string, { orders: number; revenue: number; approved: number; rejected: number; pending: number }> = {};
    let totalOrders = 0;

    for (const o of allOrders) {
      if (statsRange) {
        const d = new Date(o.created_at);
        if (!isWithinInterval(d, { start: statsRange.from, end: statsRange.to })) continue;
      }
      const country = (o.shipping_address as any)?.country || "Unknown";
      if (!byCountry[country]) byCountry[country] = { orders: 0, revenue: 0, approved: 0, rejected: 0, pending: 0 };
      byCountry[country].orders++;
      byCountry[country].revenue += o.total_amount;
      if (o.status === "approved") byCountry[country].approved++;
      else if (o.status === "rejected") byCountry[country].rejected++;
      else byCountry[country].pending++;
      totalOrders++;
    }

    const sorted = Object.entries(byCountry).sort((a, b) => b[1].approved - a[1].approved);
    return { byCountry: sorted, totalOrders };
  }, [allOrders, statsTimeFilter]);

  // Manual email catalogue search
  const manualFilteredCatalogue = useMemo(() => {
    if (!manualCatalogueSearch.trim()) return products.slice(0, 15);
    const q = manualCatalogueSearch.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [manualCatalogueSearch]);

  const addManualProduct = (product: Product) => {
    const defaultVariant = product.variants?.[0];
    const newItem: OrderItem = {
      name: product.name,
      brand: product.brand,
      price: defaultVariant?.price ?? product.price,
      quantity: 1,
      selectedMl: defaultVariant?.ml,
    };
    setManualItems(prev => [...prev, newItem]);
    setManualCatalogueSearch("");
  };

  const changeManualVariant = (index: number, product: Product, ml: number) => {
    const variant = product.variants?.find(v => v.ml === ml);
    if (!variant) return;
    setManualItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], selectedMl: ml, price: variant.price };
      return next;
    });
  };

  const manualTotal = manualItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const sendManualEmail = async () => {
    if (!manualEmail.trim() || !manualName.trim() || manualItems.length === 0) {
      toast.error("Fill in all fields and add at least one product");
      return;
    }
    setManualSending(true);
    try {
      // Build order items with image for the email function
      const orderItemsWithImages = manualItems.map(item => {
        const catalogueProduct = products.find(p =>
          p.name.toLowerCase() === item.name.toLowerCase() &&
          p.brand.toLowerCase() === item.brand.toLowerCase()
        );
        return {
          ...item,
          product: catalogueProduct ? {
            name: catalogueProduct.name,
            brand: catalogueProduct.brand,
            price: item.price,
            image: catalogueProduct.image,
            affiliateUrl: catalogueProduct.affiliateUrl,
            selectedMl: item.selectedMl,
          } : undefined,
          image: catalogueProduct?.image || "",
          affiliateUrl: catalogueProduct?.affiliateUrl || "",
          selectedPrice: item.price,
        };
      });

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-confirmation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            orderItems: orderItemsWithImages,
            customerEmail: manualEmail.trim(),
            customerName: manualName.trim(),
            shippingAddress: {},
            totalAmount: manualTotal.toFixed(2),
          }),
        }
      );
      if (res.ok) {
        toast.success(`Confirmation email sent to ${manualEmail}`);
        setManualItems([]);
        setManualEmail("");
        setManualName("");
        setManualOpen(false);
      } else {
        const json = await res.json();
        toast.error(json.error || "Failed to send email");
      }
    } catch {
      toast.error("Failed to send email");
    }
    setManualSending(false);
  };

  const handleDismiss = async (orderId: string) => {
    setActionLoading(prev => new Set(prev).add(orderId + "-dismiss"));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        setActionLoading(prev => { const n = new Set(prev); n.delete(orderId + "-dismiss"); return n; });
        return;
      }
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-orders`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, action: "dismiss" }),
        }
      );
      const json = await res.json();
      if (res.ok) {
        toast.success("Order removed");
        setAllOrders(prev => prev.filter(o => o.id !== orderId));
      } else {
        toast.error(json.error || "Failed to remove order");
      }
    } catch {
      toast.error("Failed to remove order");
    } finally {
      setActionLoading(prev => { const n = new Set(prev); n.delete(orderId + "-dismiss"); return n; });
    }
  };

  const handleAction = async (orderId: string, action: "approve" | "reject" | "request_proof", rejectionNotesOverride?: string) => {
    setActionLoading(prev => new Set(prev).add(orderId));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        setActionLoading(prev => { const n = new Set(prev); n.delete(orderId); return n; });
        return;
      }

      if (action === "request_proof") {
        const order = allOrders.find(o => o.id === orderId);
        if (!order) {
          toast.error("Order not found");
          setActionLoading(prev => { const n = new Set(prev); n.delete(orderId); return n; });
          return;
        }
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/request-proof-of-payment?id=${orderId}&token=${order.approval_token || ""}`,
          { method: "GET", headers: { "Accept": "application/json" } }
        );
        if (res.ok) {
          toast.success("Proof of payment request sent.");
        } else {
          toast.error("Failed to send proof request");
        }
      } else {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-orders`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderId, action, ...(action === "reject" ? { rejectionNotes: rejectionNotesOverride ?? "" } : {}) }),
          }
        );
        const json = await res.json();
        if (res.ok) {
          toast.success(json.message);
          const newStatus = action === "approve" ? "approved" : "rejected";
          const changedAt = new Date().toISOString();
          const nextOrders = allOrders.map(o => o.id === orderId ? { ...o, status: newStatus, updated_at: changedAt } : o);
          setAllOrders(nextOrders);
          await persistLiveCounterRow({ snapshot: buildLiveCounterSnapshot(nextOrders, liveResetAt, adSpend) });
        } else {
          toast.error(json.error || "Action failed");
        }
      }
    } catch {
      toast.error("Action failed");
    }
    setActionLoading(prev => { const n = new Set(prev); n.delete(orderId); return n; });
  };

  // Edit helpers
  const openEditDialog = (order: Order) => {
    const items = Array.isArray(order.order_items) ? order.order_items : [];
    setEditItems(JSON.parse(JSON.stringify(items)));
    setEditingOrder(order);
    setCatalogueSearch("");
    setShowCatalogue(false);
  };

  const removeEditItem = (index: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  const changeVariant = (index: number, product: Product, ml: number) => {
    const variant = product.variants?.find(v => v.ml === ml);
    if (!variant) return;
    setEditItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], selectedMl: ml, price: variant.price };
      return next;
    });
  };

  const addProductToOrder = (product: Product) => {
    const defaultVariant = product.variants?.[0];
    const newItem: OrderItem = {
      name: product.name,
      brand: product.brand,
      price: defaultVariant?.price ?? product.price,
      quantity: 1,
      selectedMl: defaultVariant?.ml,
    };
    setEditItems(prev => [...prev, newItem]);
    setShowCatalogue(false);
    setCatalogueSearch("");
  };

  const swapProduct = (index: number, product: Product) => {
    const defaultVariant = product.variants?.[0];
    setEditItems(prev => {
      const next = [...prev];
      next[index] = {
        name: product.name,
        brand: product.brand,
        price: defaultVariant?.price ?? product.price,
        quantity: next[index].quantity,
        selectedMl: defaultVariant?.ml,
      };
      return next;
    });
  };

  const editTotal = editItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Find matching product from catalogue for an order item
  const findProduct = (item: OrderItem): Product | undefined => {
    return products.find(p => 
      p.name.toLowerCase() === item.name.toLowerCase() && 
      p.brand.toLowerCase() === item.brand.toLowerCase()
    );
  };

  const filteredCatalogue = useMemo(() => {
    if (!catalogueSearch.trim()) return products.slice(0, 15);
    const q = catalogueSearch.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [catalogueSearch]);

  const saveEditItems = async () => {
    if (!editingOrder) return;
    if (editItems.length === 0) {
      toast.error("Order must have at least one item");
      return;
    }
    setEditSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-orders`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: editingOrder.id,
            action: "update_items",
            orderItems: editItems,
            totalAmount: editTotal,
          }),
        }
      );
      const json = await res.json();
      if (res.ok) {
        toast.success("Order items updated");
        const updatedId = editingOrder.id;
        const updatedItems = [...editItems];
        const updatedTotal = editTotal;
        setEditingOrder(null);
        setAllOrders(prev => prev.map(o => o.id === updatedId ? { ...o, order_items: updatedItems, total_amount: updatedTotal } : o));
      } else {
        toast.error(json.error || "Failed to update");
      }
    } catch {
      toast.error("Failed to update");
    }
    setEditSaving(false);
  };

  const combinedOrders = useMemo(() => {
    const merged = [...allOrders];
    for (const ro of remoteSearchResults) {
      if (!merged.some(o => o.id === ro.id)) {
        merged.push(ro);
      }
    }
    return merged;
  }, [allOrders, remoteSearchResults]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin h-8 w-8 text-muted-foreground" /></div>;
  }

  if (!user || !ADMIN_EMAILS.includes(user.email || "")) return null;

  const statusColors: Record<string, string> = {
    pending_approval: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    pending: "bg-gray-100 text-gray-800",
  };

  const pmColors: Record<string, string> = {
    "Rewarble": "bg-purple-100 text-purple-800",
    "Bancontact": "bg-amber-100 text-amber-800",
    "Cash on Delivery": "bg-emerald-100 text-emerald-800",
    "Other": "bg-gray-100 text-gray-800",
  };



  const filteredOrders = combinedOrders.filter(o => {
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const pm = getPaymentMethod(o.checkout_reference);
    const matchesPayment = paymentFilter === "All" || pm === paymentFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      o.customer_name.toLowerCase().includes(query) ||
      o.customer_email.toLowerCase().includes(query) ||
      (o.order_number && o.order_number.toString().includes(query));
    const matchesCustomer = !customerEmailFilter || o.customer_email.toLowerCase() === customerEmailFilter;
    const matchesCountry = !countryFilter || ((o.shipping_address as any)?.country || "Unknown") === countryFilter;
    return matchesStatus && matchesPayment && matchesSearch && matchesCustomer && matchesCountry;
  });

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Order Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Approve or reject pending orders</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => {
            fetchOrders();
            fetchBannedUsers();
          }} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6 border-b pb-3">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === "orders"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Package className="h-4 w-4 inline mr-1.5" />
            Orders
          </button>
          <button
            onClick={() => setActiveTab("live")}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === "live"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Radio className="h-4 w-4 inline mr-1.5" />
            Live Visitors
          </button>
          {user?.email === PRIMARY_ADMIN && (
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                activeTab === "reviews"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Star className="h-4 w-4 inline mr-1.5" />
              Reviews
            </button>
          )}
        </div>

        {activeTab === "live" ? (
          <LiveVisitorDashboard />
        ) : activeTab === "reviews" && user?.email === PRIMARY_ADMIN ? (
          <ReviewsAdmin />
        ) : (
        <>

        {/* Status Filter */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Status</p>
          <div className="flex gap-2 flex-wrap">
            {["pending_approval", "approved", "rejected", "all"].map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
                className="capitalize"
              >
                {s === "pending_approval" ? "Pending" : s === "all" ? "All" : s}
              </Button>
            ))}
          </div>
        </div>

        {/* Payment Method Filter */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Payment Method</p>
          <div className="flex gap-2 flex-wrap">
            {PAYMENT_METHODS.map((pm) => (
              <Button
                key={pm}
                variant={paymentFilter === pm ? "default" : "outline"}
                size="sm"
                onClick={() => setPaymentFilter(pm)}
              >
                {pm}
              </Button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or order number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {remoteSearching && (
            <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Revenue Tally */}
        {approvedOrders.length > 0 && !isRestrictedAdmin && (
          <div className="mb-6 border rounded-lg p-4 bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Revenue (Approved Orders) — {revenueTally.count} orders
              </p>
            </div>
            {/* Date presets */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                { key: "all", label: "All Time" },
                { key: "today", label: "Today" },
                { key: "yesterday", label: "Yesterday" },
                { key: "this_week", label: "This Week" },
                { key: "7days", label: "Last 7 Days" },
                { key: "this_month", label: "This Month" },
                { key: "last_month", label: "Last Month" },
                { key: "30days", label: "Last 30 Days" },
                { key: "custom", label: "Custom" },
              ].map(p => (
                <button
                  key={p.key}
                  onClick={() => setDatePreset(p.key)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                    datePreset === p.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-input hover:bg-accent"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {/* Custom date pickers */}
            {datePreset === "custom" && (
              <div className="flex flex-wrap gap-2 mb-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {customFrom ? format(customFrom, "dd/MM/yyyy") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {customTo ? format(customTo, "dd/MM/yyyy") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={customTo} onSelect={setCustomTo} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            {dateRange && (
              <p className="text-xs text-muted-foreground mb-2">
                {format(dateRange.from, "dd MMM yyyy")} – {format(dateRange.to, "dd MMM yyyy")}
              </p>
            )}
            <div className="flex flex-wrap gap-4 items-end">
              {Object.entries(revenueTally.byMethod).sort((a, b) => b[1] - a[1]).map(([method, amount]) => (
                <div key={method} className="text-center">
                  <p className="text-xs text-muted-foreground">{method}</p>
                  <p className="text-sm font-semibold">€{amount.toFixed(2)}</p>
                </div>
              ))}
              <div className="text-center border-l pl-4 ml-2">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-primary">€{revenueTally.total.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Live Counter — Rewarble / iDEAL / PayPal */}
        <div className="mb-6 border rounded-lg p-4 bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Live Counter — Rewarble / iDEAL / PayPal
              </p>
              {!isRestrictedAdmin && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Since {format(new Date(liveResetAt), "dd MMM yyyy, HH:mm")} · {liveCounter.count} approved orders
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setAdSpendInput("");
                  setAdSpendDialogOpen(true);
                }}
              >
                Ad Budget
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  if (confirm("Reset live counter and ad spend? This starts a new day.")) {
                    const now = new Date().toISOString();
                    const nextHistory = [
                      {
                        id: now,
                        resetAt: now,
                        periodStart: liveResetAt,
                        periodEnd: now,
                        gross: liveCounter.gross,
                        adSpend: adSpend,
                        net: liveCounter.net,
                        count: liveCounter.count,
                        orders: liveCounter.orders,
                      },
                      ...resetHistory,
                    ].slice(0, 200);
                    persistLiveCounterRow({
                      resetAt: now,
                      adSpendValue: 0,
                      history: nextHistory,
                      snapshot: buildLiveCounterSnapshot(allOrders, now, 0),
                    });
                  }
                }}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reset Day
              </Button>
            </div>
          </div>
          <div className={`grid ${isRestrictedAdmin ? "grid-cols-2" : "grid-cols-3"} gap-4 items-end`}>
            {!isRestrictedAdmin && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Gross</p>
                <p className="text-sm font-semibold">€{liveCounter.gross.toFixed(2)}</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Ad Spend</p>
              <p className="text-sm font-semibold text-destructive">−€{adSpend.toFixed(2)}</p>
            </div>
            <div className="text-center border-l pl-4">
              <p className="text-xs text-muted-foreground">{isRestrictedAdmin ? "Total" : "Net Total"}</p>
              <p
                className={`text-lg font-bold ${
                  liveCounter.net < 0 ? "text-destructive" : "text-green-500"
                }`}
              >
                €{liveCounter.net.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Current live orders expandable */}
          {!isRestrictedAdmin && liveCounter.orders.length > 0 && (
            <div className="mt-3 border-t pt-2">
              <button
                onClick={() => setLiveOrdersExpanded((v) => !v)}
                className="w-full flex items-center justify-between text-left hover:bg-muted/30 rounded px-1 py-1 transition-colors"
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Contributing Orders — {liveCounter.orders.length} {liveCounter.orders.length === 1 ? "order" : "orders"}
                </p>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${liveOrdersExpanded ? "rotate-180" : ""}`} />
              </button>
              {liveOrdersExpanded && (
                <div className="mt-2 pl-4 border-l border-border/60 space-y-1 max-h-64 overflow-y-auto">
                  {liveCounter.orders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between gap-2 py-0.5 text-xs">
                      <div className="text-muted-foreground truncate">
                        <span className="font-mono opacity-70">#{o.order_number ?? "—"}</span>
                        <span className="ml-2">{o.customer_name}</span>
                        <span className="ml-1 opacity-60">· {o.customer_email}</span>
                        <span className="ml-2 uppercase text-[10px] opacity-70">{o.method}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="opacity-60">{format(new Date(o.approvedAt), "HH:mm")}</span>
                        <strong>€{o.total_amount.toFixed(2)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reset history */}
          {!isRestrictedAdmin && (
          <div className="mt-4 border-t pt-3">
            <button
              onClick={() => setHistoryOpen((v) => !v)}
              className="w-full flex items-center justify-between text-left hover:bg-muted/30 rounded px-1 py-1 transition-colors"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Reset History — {resetHistory.length} {resetHistory.length === 1 ? "day" : "days"}
              </p>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${historyOpen ? "rotate-180" : ""}`} />
            </button>
            {historyOpen && (
              <div className="mt-2 space-y-1.5 max-h-72 overflow-y-auto">
                {resetHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 text-center">No resets yet.</p>
                ) : (
                  resetHistory.map((h) => {
                    const isOpen = !!expandedHistoryIds[h.id];
                    const hasOrders = !!(h.orders && h.orders.length > 0);
                    return (
                    <div key={h.id} className="text-xs border rounded px-2 py-1.5 bg-background/40">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => hasOrders && setExpandedHistoryIds((p) => ({ ...p, [h.id]: !p[h.id] }))}
                          className={`text-muted-foreground flex items-center gap-1 text-left ${hasOrders ? "hover:text-foreground cursor-pointer" : "cursor-default"}`}
                        >
                          {hasOrders && (
                            <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : "-rotate-90"}`} />
                          )}
                          <span>
                            {format(new Date(h.periodStart), "dd MMM HH:mm")} → {format(new Date(h.periodEnd), "dd MMM HH:mm")}
                            <span className="ml-2 opacity-70">· {h.count} orders</span>
                          </span>
                        </button>
                        <div className="flex gap-3">
                          <span>Gross <strong>€{h.gross.toFixed(2)}</strong></span>
                          <span className="text-destructive">Ads −€{h.adSpend.toFixed(2)}</span>
                          <span className={h.net < 0 ? "text-destructive font-semibold" : "text-green-500 font-semibold"}>
                            Net €{h.net.toFixed(2)}
                          </span>
                          <button
                            onClick={() => {
                              if (confirm("Delete this history entry?")) {
                                const nextHistory = resetHistory.filter((x) => x.id !== h.id);
                                persistLiveCounterRow({ history: nextHistory });
                              }
                            }}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Delete entry"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      {isOpen && hasOrders && (
                        <div className="mt-2 pl-4 border-l border-border/60 space-y-1">
                          {h.orders!.map((o) => (
                            <div key={o.id} className="flex items-center justify-between gap-2 py-0.5">
                              <div className="text-muted-foreground truncate">
                                <span className="font-mono opacity-70">#{o.order_number ?? "—"}</span>
                                <span className="ml-2">{o.customer_name}</span>
                                <span className="ml-1 opacity-60">· {o.customer_email}</span>
                                <span className="ml-2 uppercase text-[10px] opacity-70">{o.method}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="opacity-60">{format(new Date(o.approvedAt), "HH:mm")}</span>
                                <strong>€{o.total_amount.toFixed(2)}</strong>
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
        </div>

        {/* Personal Custom Tally — primary admin only */}
        {isPrimaryAdmin && (
          <div className="mb-6 border rounded-lg p-4 bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Personal Custom Tally
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Since {format(new Date(personalResetAt), "dd MMM yyyy, HH:mm")} · fully manual · not affected by orders
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  if (confirm("Reset your personal custom tally to €0.00?")) {
                    const now = new Date().toISOString();
                    setPersonalResetAt(now);
                    setPersonalAdjustments([]);
                    setAdjustInput("");
                    toast.success("Personal tally reset");
                  }
                }}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
            <div className="text-center mb-3">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-green-500">€{personalTotal.toFixed(2)}</p>
            </div>

            {/* Contributing Adjustments */}
            {personalAdjustments.length > 0 && (
              <div className="mb-3 border-t pt-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Contributing Adjustments
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {personalAdjustments.slice().reverse().map((adj, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">
                        {format(new Date(adj.timestamp), "dd MMM yyyy, HH:mm")}
                      </span>
                      <span className={adj.amount >= 0 ? "text-green-500 font-medium" : "text-red-400 font-medium"}>
                        {adj.amount >= 0 ? "+" : ""}€{adj.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="Amount (€)"
                value={adjustInput}
                onChange={(e) => setAdjustInput(e.target.value)}
                className="h-8 text-xs w-32"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => {
                  const v = parseFloat(adjustInput);
                  if (!Number.isFinite(v) || v <= 0) { toast.error("Enter a positive amount"); return; }
                  applyPersonalAdjustment(v);
                  setAdjustInput("");
                }}
              >+ Add</Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => {
                  const v = parseFloat(adjustInput);
                  if (!Number.isFinite(v) || v <= 0) { toast.error("Enter a positive amount"); return; }
                  applyPersonalAdjustment(-v);
                  setAdjustInput("");
                }}
              >− Subtract</Button>
            </div>
          </div>
        )}

        <BancontactPanel userEmail={user?.email || ""} />


        <Dialog open={adSpendDialogOpen} onOpenChange={setAdSpendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Ad Spend</DialogTitle>
              <DialogDescription>
                Enter the amount (in €) spent on ads. It will be subtracted from
                the live net total. Current ad spend: €{adSpend.toFixed(2)}
              </DialogDescription>
            </DialogHeader>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 25.00"
              value={adSpendInput}
              onChange={(e) => setAdSpendInput(e.target.value)}
              autoFocus
            />
            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  persistLiveCounterRow({
                    adSpendValue: 0,
                    snapshot: buildLiveCounterSnapshot(allOrders, liveResetAt, 0),
                  });
                  setAdSpendDialogOpen(false);
                  toast.success("Ad spend cleared");
                }}
              >
                Clear all
              </Button>
              <Button
                onClick={() => {
                  const amt = parseFloat(adSpendInput);
                  if (isNaN(amt) || amt <= 0) {
                    toast.error("Enter a valid amount");
                    return;
                  }
                  const nextAdSpend = adSpend + amt;
                  persistLiveCounterRow({
                    adSpendValue: nextAdSpend,
                    snapshot: buildLiveCounterSnapshot(allOrders, liveResetAt, nextAdSpend),
                  });
                  setAdSpendDialogOpen(false);
                  toast.success(`Added €${amt.toFixed(2)} ad spend`);
                }}
              >
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        {/* Order Statistics by Country */}
        {allOrders.length > 0 && (
          <div className="mb-6 border rounded-lg bg-card">
            <button
              onClick={() => setStatsOpen(!statsOpen)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Order Statistics by Country — {countryStats.totalOrders} orders
                </p>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${statsOpen ? "rotate-180" : ""}`} />
            </button>
            {statsOpen && (
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {[
                    { key: "all", label: "All Time" },
                    { key: "today", label: "Today" },
                    { key: "yesterday", label: "Yesterday" },
                    { key: "7days", label: "Last 7 Days" },
                    { key: "last_month", label: "Last Month" },
                  ].map(p => (
                    <button
                      key={p.key}
                      onClick={() => setStatsTimeFilter(p.key)}
                      className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                        statsTimeFilter === p.key
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-input hover:bg-accent"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {countryStats.byCountry.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders in this period</p>
                ) : (
                  <div className="space-y-2">
                    {countryStats.byCountry.map(([country, data]) => (
                      <div key={country} className="flex items-center gap-3 py-2 px-3 rounded-md bg-muted/30 border">
                        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{country}</span>
                            <span className="text-sm font-semibold">€{data.revenue.toFixed(2)}</span>
                          </div>
                          <div className="flex gap-3 mt-0.5">
                            <span className="text-xs text-muted-foreground">{data.orders} order{data.orders !== 1 ? 's' : ''}</span>
                            {data.approved > 0 && (
                              <button
                                onClick={() => { setCountryFilter(country); setStatusFilter("approved"); }}
                                className="text-xs text-green-600 hover:underline cursor-pointer"
                              >
                                {data.approved} approved
                              </button>
                            )}
                            {data.pending > 0 && (
                              <button
                                onClick={() => { setCountryFilter(country); setStatusFilter("pending_approval"); }}
                                className="text-xs text-yellow-600 hover:underline cursor-pointer"
                              >
                                {data.pending} pending
                              </button>
                            )}
                            {data.rejected > 0 && (
                              <button
                                onClick={() => { setCountryFilter(country); setStatusFilter("rejected"); }}
                                className="text-xs text-red-600 hover:underline cursor-pointer"
                              >
                                {data.rejected} rejected
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden shrink-0">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(data.orders / countryStats.totalOrders) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mb-6 border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Send Manual Order Email</p>
            <Button variant="outline" size="sm" onClick={() => setManualOpen(!manualOpen)}>
              <Mail className="h-4 w-4 mr-1" /> {manualOpen ? "Close" : "Compose"}
            </Button>
          </div>
          {manualOpen && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Customer Name</label>
                  <Input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="John Doe" className="h-9" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Customer Email</label>
                  <Input value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} placeholder="john@example.com" className="h-9" />
                </div>
              </div>

              {/* Selected items */}
              {manualItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Products</p>
                  {manualItems.map((item, i) => {
                    const catalogueProduct = findProduct(item);
                    return (
                      <div key={i} className="border rounded-md p-3 relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 text-destructive"
                          onClick={() => setManualItems(prev => prev.filter((_, idx) => idx !== i))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <p className="text-sm font-medium pr-8">{item.brand} — {item.name}</p>
                        {catalogueProduct?.variants && catalogueProduct.variants.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {catalogueProduct.variants.map(v => (
                              <button
                                key={v.ml}
                                onClick={() => changeManualVariant(i, catalogueProduct, v.ml)}
                                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                                  item.selectedMl === v.ml
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-muted/50 border-border hover:bg-muted"
                                }`}
                              >
                                {v.ml}ml — €{v.price.toFixed(2)}
                              </button>
                            ))}
                          </div>
                        )}
                        {!catalogueProduct?.variants && (
                          <p className="text-xs text-muted-foreground mt-1">{item.selectedMl ? `${item.selectedMl}ml — ` : ""}€{item.price.toFixed(2)}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add products */}
              <div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search catalogue to add products..."
                    value={manualCatalogueSearch}
                    onChange={(e) => setManualCatalogueSearch(e.target.value)}
                    className="h-8 text-sm pl-8"
                  />
                </div>
                {manualCatalogueSearch.trim() && (
                  <div className="max-h-48 overflow-y-auto space-y-1 mt-2 border rounded-md p-1">
                    {manualFilteredCatalogue.map(p => (
                      <button
                        key={p.id}
                        onClick={() => addManualProduct(p)}
                        className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors flex justify-between items-center"
                      >
                        <span><span className="font-medium">{p.brand}</span> — {p.name}</span>
                        <span className="text-xs text-muted-foreground">€{p.price.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Total and send */}
              <div className="flex items-center justify-between border-t pt-3">
                <p className="text-sm font-semibold">Total: €{manualTotal.toFixed(2)}</p>
                <Button
                  onClick={sendManualEmail}
                  disabled={manualSending || manualItems.length === 0 || !manualEmail.trim() || !manualName.trim()}
                  size="sm"
                >
                  <Mail className="h-4 w-4 mr-1" /> {manualSending ? "Sending..." : "Send Confirmation Email"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {countryFilter && (
          <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
            <Globe className="h-4 w-4 text-blue-700 shrink-0" />
            <p className="text-sm text-blue-800 flex-1">
              Filtering by country: <strong>{countryFilter}</strong>
            </p>
            <button
              onClick={() => setCountryFilter("")}
              className="text-xs text-blue-700 hover:text-blue-900 font-medium underline"
            >
              Clear filter
            </button>
          </div>
        )}

        {customerEmailFilter && (
          <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
            <Users className="h-4 w-4 text-amber-700 shrink-0" />
            <p className="text-sm text-amber-800 flex-1">
              Showing all orders from <strong>{allOrders.find(o => o.customer_email.toLowerCase() === customerEmailFilter)?.customer_name || customerEmailFilter}</strong> ({emailOrderCounts[customerEmailFilter] || 0} orders total)
            </p>
            <button
              onClick={() => setCustomerEmailFilter("")}
              className="text-xs text-amber-700 hover:text-amber-900 font-medium underline"
            >
              Clear filter
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No orders found</p>
          </div>
        ) : (
          <div className={`space-y-4 transition-opacity duration-200 ${transitioning ? "opacity-50" : "opacity-100"}`}>
            {filteredOrders.map((order) => {
              const items = (Array.isArray(order.order_items) ? order.order_items : []) as OrderItem[];
              const date = new Date(order.created_at);
              const pm = getPaymentMethod(order.checkout_reference);

              return (
                <div key={order.id} className={`border rounded-lg p-5 ${hassanMarked.has(order.id) ? "bg-yellow-50 border-yellow-300" : "bg-card"}`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">#{order.order_number || '—'}</span>
                        <h3 className="font-semibold text-base">{order.customer_name}</h3>
                        <Badge className={statusColors[order.status] || "bg-gray-100 text-gray-800"}>
                          {order.status.replace("_", " ")}
                        </Badge>
                        <Badge className={pmColors[pm] || "bg-gray-100 text-gray-800"}>
                          {pm}
                        </Badge>
                        {(() => {
                          const country = (order.shipping_address as any)?.country;
                          return country ? (
                            <Badge className="bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold px-3 py-1 gap-1.5 border-0">
                              <span className="text-base leading-none">📍</span>
                              {country}
                            </Badge>
                          ) : null;
                        })()}
                        {(() => {
                          const count = emailOrderCounts[order.customer_email.toLowerCase()] || 0;
                          return count > 1 ? (
                            <Badge 
                              className="bg-amber-100 text-amber-800 border-amber-300 gap-1 cursor-pointer hover:bg-amber-200 transition-colors"
                              onClick={() => {
                                setCustomerEmailFilter(order.customer_email.toLowerCase());
                                setStatusFilter("all");
                              }}
                            >
                              <Users className="h-3 w-3" />
                              Repeat ({count} orders)
                            </Badge>
                          ) : null;
                        })()}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                        {bannedEmails.has(order.customer_email.toLowerCase()) && (
                          <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-[10px]">
                            <Ban className="h-3 w-3 mr-0.5" /> Banned
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} at {date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {order.first_visit_at && (() => {
                        const firstVisit = new Date(order.first_visit_at);
                        const placed = new Date(order.created_at);
                        const diffMs = Math.max(0, placed.getTime() - firstVisit.getTime());
                        const mins = Math.floor(diffMs / 60000);
                        const hrs = Math.floor(mins / 60);
                        const days = Math.floor(hrs / 24);
                        const timeToOrder = days > 0
                          ? `${days}d ${hrs % 24}h ${mins % 60}m`
                          : hrs > 0
                          ? `${hrs}h ${mins % 60}m`
                          : `${mins}m`;
                        const fmt = (d: Date) =>
                          `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
                        return (
                          <div className="mt-2 text-[11px] text-muted-foreground bg-muted/40 rounded px-2 py-1 inline-block">
                            <div>🕒 First visit: <span className="font-mono">{fmt(firstVisit)}</span></div>
                            <div>🛒 Order placed: <span className="font-mono">{fmt(placed)}</span></div>
                            <div>⏱ Time to order: <span className="font-mono font-semibold">{timeToOrder}</span></div>
                          </div>
                        );
                      })()}
                      {order.shipping_address && (() => {
                        const addr = order.shipping_address as any;
                        const hasAny = addr.line1 || addr.city || addr.postalCode || addr.country;
                        if (!hasAny) return null;
                        return (
                          <div className="mt-3 bg-muted/40 border rounded-md px-3 py-2 text-sm">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Shipping Address</p>
                            <p className="font-medium text-foreground">{order.customer_name}</p>
                            {addr.line1 && <p className="text-foreground/90">{addr.line1}</p>}
                            {(addr.postalCode || addr.city) && (
                              <p className="text-foreground/90">
                                {addr.postalCode}{addr.postalCode && addr.city ? ' ' : ''}{addr.city}
                              </p>
                            )}
                            {addr.country && <p className="text-foreground font-semibold">{addr.country}</p>}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">EUR {order.total_amount.toFixed(2)}</p>
                      {order.discount_code && (
                        <Badge variant="outline" className="text-green-600 border-green-300 mt-1 text-[10px]">
                          {order.discount_code} ({order.discount_percent}% off)
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Items</p>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEditDialog(order)}>
                        <Pencil className="h-3 w-3 mr-1" /> Edit Items
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>
                            <span className="font-medium">{item.brand}</span> — {item.name}
                            {item.selectedMl ? ` (${item.selectedMl}ml)` : ""}
                            {item.quantity > 1 ? ` x${item.quantity}` : ""}
                          </span>
                          <span className="text-muted-foreground">EUR {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    {order.discount_code && order.discount_percent ? (() => {
                      const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
                      const discountAmount = subtotal * (order.discount_percent / 100);
                      return (
                        <div className="mt-2 pt-2 border-t border-dashed space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>EUR {subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Discount ({order.discount_code} — {order.discount_percent}%)</span>
                            <span>−EUR {discountAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-semibold">
                            <span>Total</span>
                            <span>EUR {order.total_amount.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })() : null}
                  </div>

                  {order.gift_card_code && (
                    <div className="mt-3 border-t pt-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Gift Card Code</p>
                      <p className="font-mono text-sm font-bold text-purple-700 bg-purple-50 inline-block px-3 py-1.5 rounded border border-purple-200">{order.gift_card_code}</p>
                    </div>
                  )}

                  {/* Proof of Payment */}
                  <div className="mt-3 border-t pt-3">
                    <div className="flex items-center gap-2 mb-1">
                      <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Proof of Payment</p>
                    </div>
                    {order.proof_url ? (
                      <div className="flex flex-wrap gap-2">
                        {order.proof_url.split(',').map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded hover:bg-green-100 transition-colors"
                          >
                            <ImageIcon className="h-3 w-3" />
                            View Proof {order.proof_url.split(',').length > 1 ? `#${i + 1}` : ''}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">
                        No proof uploaded
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex gap-3 flex-wrap">
                    {!isRestrictedAdmin && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleAction(order.id, "approve")}
                          disabled={actionLoading.has(order.id)}
                        >
                          <Check className="h-4 w-4 mr-1" /> {actionLoading.has(order.id) ? "Processing..." : order.status === "approved" ? "Re-Approve" : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const payMethod = getPaymentMethod(order.checkout_reference);
                            if (payMethod === "Revolut") {
                              setRevolutRejectingOrder(order);
                              setRevolutRejectMessage("");
                            } else {
                              setRejectingOrder(order); setRejectionNotes(""); setRejectionReason(""); setMismatchCodeValue(""); setMismatchCartValue(order.total_amount?.toString() || ""); setMismatchCurrency("EUR"); setCustomRecommendedCard(""); setRecommendedCardCurrency("EUR");
                            }
                          }}
                          disabled={actionLoading.has(order.id)}
                        >
                          <X className="h-4 w-4 mr-1" /> {order.status === "rejected" ? "Re-Reject" : "Reject"}
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(order.id, "request_proof")}
                      disabled={actionLoading.has(order.id)}
                    >
                      <Mail className="h-4 w-4 mr-1" /> Request Proof
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground"
                      onClick={() => handleDismiss(order.id)}
                      disabled={actionLoading.has(order.id + "-dismiss")}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> {actionLoading.has(order.id + "-dismiss") ? "Removing..." : "Remove"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={hassanMarked.has(order.id) ? "text-yellow-700 bg-yellow-100 hover:bg-yellow-200" : "text-muted-foreground"}
                      onClick={() => {
                        setHassanMarked((prev) => {
                          const next = new Set(prev);
                          if (next.has(order.id)) next.delete(order.id); else next.add(order.id);
                          return next;
                        });
                      }}
                    >
                      <Star className="h-4 w-4 mr-1" /> Hassan
                    </Button>
                    <Button
                      size="sm"
                      variant={bannedEmails.has(order.customer_email.toLowerCase()) ? "outline" : "ghost"}
                      className={bannedEmails.has(order.customer_email.toLowerCase()) ? "text-destructive border-destructive" : "text-muted-foreground"}
                      onClick={() => handleBanToggle(order.customer_email)}
                    >
                      <Ban className="h-4 w-4 mr-1" /> {bannedEmails.has(order.customer_email.toLowerCase()) ? "Unban" : "Ban Account"}
                    </Button>
                  </div>

                  {/* Rejection Notes - Displayed prominently under action buttons for rejected orders */}
                  {order.status === "rejected" && order.rejection_notes && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <X className="h-4 w-4 text-red-600" />
                        <p className="text-sm font-semibold text-red-800 uppercase tracking-wider">Rejection Reason</p>
                      </div>
                      <p className="text-sm text-red-700 whitespace-pre-wrap leading-relaxed">{order.rejection_notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </>
        )}
      </div>


      {/* Rejection Notes Dialog */}
      <Dialog open={!!rejectingOrder} onOpenChange={(open) => { if (!open) setRejectingOrder(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reject Order — #{rejectingOrder?.order_number || '—'}</DialogTitle>
            <DialogDescription>Select a rejection reason to send to the customer.</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <label className="text-sm font-medium mb-1 block">Rejection Reason</label>
            <div className="grid gap-2">
              {/* Option 1: Code Invalid */}
              <button
                type="button"
                onClick={() => { setRejectionReason("code_invalid"); setRejectionNotes(""); }}
                className={`text-left p-3 rounded-lg border-2 transition-colors ${
                  rejectionReason === "code_invalid"
                    ? "border-red-500 bg-red-50"
                    : "border-input bg-background hover:bg-accent"
                }`}
              >
                <span className="font-medium text-sm">❌ Code Invalid</span>
                <p className="text-xs text-muted-foreground mt-1">The gift card code is fake, already used, or otherwise invalid.</p>
              </button>
              {/* Option 2: Value Mismatch */}
              <button
                type="button"
                onClick={() => {
                  setRejectionReason("value_mismatch");
                  setRejectionNotes("");
                }}
                className={`text-left p-3 rounded-lg border-2 transition-colors ${
                  rejectionReason === "value_mismatch"
                    ? "border-red-500 bg-red-50"
                    : "border-input bg-background hover:bg-accent"
                }`}
              >
                <span className="font-medium text-sm">💰 Code Value & Cart Value Mismatch</span>
                <p className="text-xs text-muted-foreground mt-1">The gift card value doesn't cover the full order total.</p>
              </button>
              {/* Option 3: Order Number Provided */}
              <button
                type="button"
                onClick={() => { setRejectionReason("order_number"); setRejectionNotes(""); }}
                className={`text-left p-3 rounded-lg border-2 transition-colors ${
                  rejectionReason === "order_number"
                    ? "border-red-500 bg-red-50"
                    : "border-input bg-background hover:bg-accent"
                }`}
              >
                <span className="font-medium text-sm">🔢 Order Number Provided Instead</span>
                <p className="text-xs text-muted-foreground mt-1">Customer sent the Rewarble order number instead of the actual gift card code. Email includes step-by-step instructions (open email → Get Order → Display Key).</p>
              </button>
              {/* Option 3b: Eneba Order Number Provided */}
              <button
                type="button"
                onClick={() => { setRejectionReason("eneba_order_number"); setRejectionNotes(""); }}
                className={`text-left p-3 rounded-lg border-2 transition-colors ${
                  rejectionReason === "eneba_order_number"
                    ? "border-red-500 bg-red-50"
                    : "border-input bg-background hover:bg-accent"
                }`}
              >
                <span className="font-medium text-sm">🧾 Eneba Order Number Provided Instead</span>
                <p className="text-xs text-muted-foreground mt-1">Customer sent the Eneba order number instead of the gift card code. Email tells them to open the Eneba email → press "Product details" to reveal the 16-char code.</p>
              </button>
              {/* Option 4: Custom Reason */}
              <button
                type="button"
                onClick={() => { setRejectionReason("custom"); setRejectionNotes(""); }}
                className={`text-left p-3 rounded-lg border-2 transition-colors ${
                  rejectionReason === "custom"
                    ? "border-red-500 bg-red-50"
                    : "border-input bg-background hover:bg-accent"
                }`}
              >
                <span className="font-medium text-sm">✏️ Custom Reason</span>
                <p className="text-xs text-muted-foreground mt-1">Write any rejection message you want — it will be sent as the main body of the email.</p>
              </button>
            </div>

            {/* Show structured inputs for value_mismatch */}
            {rejectionReason === "value_mismatch" && (() => {
              const currencyInfo = CURRENCIES.find(c => c.code === mismatchCurrency) || CURRENCIES[0];
              const rawCodeVal = parseFloat(mismatchCodeValue) || 0;
              // Convert code value to EUR
              const codeValInEur = mismatchCurrency === "EUR" ? rawCodeVal : rawCodeVal / currencyInfo.rate;
              const cartVal = parseFloat(mismatchCartValue) || 0;
              const missing = Math.max(0, cartVal - codeValInEur);
              const nearestCard = (amount: number) => {
                const lower = Math.floor(amount / 5) * 5;
                return (amount - lower) >= 4.99 ? lower + 5 : lower;
              };
              const recommendedCard = missing > 0 ? nearestCard(missing) : 0;
              // Common Rewarble currencies
              const commonCurrencies = ["EUR", "GBP", "USD", "CHF", "SEK", "DKK", "NOK", "PLN", "CZK", "TRY", "CAD", "AUD"];
              return (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Code Value</label>
                      <Input type="number" step="0.01" placeholder="e.g. 15" value={mismatchCodeValue} onChange={(e) => setMismatchCodeValue(e.target.value)} autoFocus />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Currency</label>
                      <select
                        value={mismatchCurrency}
                        onChange={(e) => setMismatchCurrency(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {commonCurrencies.map(code => {
                          const c = CURRENCIES.find(cur => cur.code === code);
                          return c ? <option key={code} value={code}>{c.symbol} {code}</option> : null;
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Cart Value (€)</label>
                      <Input type="number" step="0.01" value={mismatchCartValue} readOnly className="bg-muted" />
                    </div>
                  </div>
                  {mismatchCurrency !== "EUR" && rawCodeVal > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {currencyInfo.symbol}{rawCodeVal.toFixed(2)} {mismatchCurrency} ≈ €{codeValInEur.toFixed(2)}
                    </p>
                  )}
                  {missing > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm space-y-2">
                      <p className="font-medium text-amber-800">Missing: €{missing.toFixed(2)}</p>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-amber-700 whitespace-nowrap">Recommended card:</label>
                        <select
                          value={recommendedCardCurrency}
                          onChange={(e) => setRecommendedCardCurrency(e.target.value)}
                          className="h-7 rounded-md border border-amber-300 bg-white px-2 text-sm"
                        >
                          <option value="EUR">€ EUR</option>
                          <option value="GBP">£ GBP</option>
                          <option value="USD">$ USD</option>
                        </select>
                        <Input
                          type="number"
                          step="5"
                          className="h-7 w-20 text-sm"
                          value={customRecommendedCard || recommendedCard}
                          onChange={(e) => setCustomRecommendedCard(e.target.value)}
                        />
                      </div>
                      <p className="text-amber-700 text-xs">Customer will be told to use a <strong>{recommendedCardCurrency === "EUR" ? "€" : recommendedCardCurrency === "GBP" ? "£" : "$"}{customRecommendedCard || recommendedCard} {recommendedCardCurrency}</strong> Rewarble card.</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Custom notes for non-mismatch reasons */}
            {rejectionReason && rejectionReason !== "value_mismatch" && (
              <div className="mt-3">
                <label className="text-sm font-medium mb-1 block">
                  {rejectionReason === "custom" ? "Custom Rejection Message" : "Additional Notes (optional)"}
                </label>
                <Textarea
                  placeholder={rejectionReason === "custom" ? "Write the full message the customer will see in the email body..." : "Any extra details..."}
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  rows={rejectionReason === "custom" ? 5 : 2}
                  autoFocus={rejectionReason === "custom"}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingOrder(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={rejectLoading || !rejectionReason || (rejectionReason === "custom" && !rejectionNotes.trim())}
              onClick={async () => {
                if (!rejectingOrder || !rejectionReason) return;
                setRejectLoading(true);
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session) { toast.error("Not authenticated"); return; }
                  const res = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-orders`,
                    {
                      method: "POST",
                      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
                      body: JSON.stringify({ orderId: rejectingOrder.id, action: "reject", rejectionReason, rejectionNotes, ...(rejectionReason === "value_mismatch" ? (() => { const ci = CURRENCIES.find(c => c.code === mismatchCurrency) || CURRENCIES[0]; const raw = parseFloat(mismatchCodeValue) || 0; const eurVal = mismatchCurrency === "EUR" ? raw : raw / ci.rate; const nearestCardCalc = (a: number) => { const l = Math.floor(a / 5) * 5; return (a - l) >= 4.99 ? l + 5 : l; }; const missing = Math.max(0, (parseFloat(mismatchCartValue) || 0) - (Math.round(eurVal * 100) / 100)); return { mismatchCodeValue: Math.round(eurVal * 100) / 100, mismatchCartValue: parseFloat(mismatchCartValue) || 0, customRecommendedCard: customRecommendedCard ? parseFloat(customRecommendedCard) : (missing > 0 ? nearestCardCalc(missing) : 0), recommendedCardCurrency, originalCodeValue: raw, originalCodeCurrency: mismatchCurrency }; })() : {}) }),
                    }
                  );
                  const json = await res.json();
                  if (res.ok) {
                    toast.success(json.message);
                    const rejectedId = rejectingOrder.id;
                    setRejectingOrder(null);
                    setAllOrders(prev => prev.map(o => o.id === rejectedId ? { ...o, status: "rejected", rejection_notes: rejectionNotes || null } : o));
                  } else {
                    toast.error(json.error || "Failed to reject");
                  }
                } catch { toast.error("Failed to reject"); }
                finally { setRejectLoading(false); }
              }}
            >
              {rejectLoading ? "Rejecting..." : "Reject Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revolut Rejection Dialog */}
      <Dialog open={!!revolutRejectingOrder} onOpenChange={(open) => { if (!open) setRevolutRejectingOrder(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Revolut Order — #{revolutRejectingOrder?.order_number || '—'}</DialogTitle>
            <DialogDescription>Optionally add a message to include in the rejection email.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Optional message (e.g. 'Payment not received', 'Wrong amount sent'...)"
              value={revolutRejectMessage}
              onChange={(e) => setRevolutRejectMessage(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevolutRejectingOrder(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={revolutRejectLoading}
              onClick={async () => {
                if (!revolutRejectingOrder) return;
                setRevolutRejectLoading(true);
                const message = revolutRejectMessage.trim() || "Payment not received.";
                await handleAction(revolutRejectingOrder.id, "reject", message);
                setRevolutRejectLoading(false);
                setRevolutRejectingOrder(null);
              }}
            >
              {revolutRejectLoading ? "Rejecting..." : "Reject Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Order Items Dialog */}
      <Dialog open={!!editingOrder} onOpenChange={(open) => { if (!open) { setEditingOrder(null); setShowCatalogue(false); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order — #{editingOrder?.order_number || '—'}</DialogTitle>
            <DialogDescription>Remove, swap, or add items. Save then re-approve to send updated email.</DialogDescription>
          </DialogHeader>

          {/* Current items */}
          <div className="space-y-3 py-2">
            {editItems.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No items. Add from catalogue below.</p>
            )}
            {editItems.map((item, i) => {
              const catalogueProduct = findProduct(item);
              return (
                <div key={i} className="border rounded-md p-3 relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 text-destructive"
                    onClick={() => removeEditItem(i)}
                    title="Remove item"
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  <p className="text-sm font-medium pr-8">
                    {item.brand} — {item.name}
                    {item.quantity > 1 ? ` x${item.quantity}` : ""}
                      </p>

                  {/* Variant selector */}
                  {catalogueProduct?.variants && catalogueProduct.variants.length > 0 ? (
                    <div className="flex gap-2 mt-2">
                      {catalogueProduct.variants.map(v => (
                        <button
                          key={v.ml}
                          onClick={() => changeVariant(i, catalogueProduct, v.ml)}
                          className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                            item.selectedMl === v.ml
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/50 border-border hover:bg-muted"
                          }`}
                        >
                          {v.ml}ml — €{v.price.toFixed(2)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.selectedMl ? `${item.selectedMl}ml` : ""} — EUR {item.price.toFixed(2)}
                    </p>
                  )}

                  {/* Swap button */}
                  <SwapSearch item={item} index={i} onSwap={swapProduct} />
                </div>
              );
            })}
          </div>

          {/* Add from catalogue */}
          <div className="border-t pt-3">
            {!showCatalogue ? (
              <Button variant="outline" size="sm" className="w-full" onClick={() => setShowCatalogue(true)}>
                <Plus className="h-3 w-3 mr-1" /> Add Item from Catalogue
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={catalogueSearch}
                    onChange={(e) => setCatalogueSearch(e.target.value)}
                    className="h-8 text-sm pl-8"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredCatalogue.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addProductToOrder(p)}
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors flex justify-between items-center"
                    >
                      <span><span className="font-medium">{p.brand}</span> — {p.name}</span>
                      <span className="text-xs text-muted-foreground">€{p.price.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setShowCatalogue(false); setCatalogueSearch(""); }}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-sm font-semibold">New Total: EUR {editTotal.toFixed(2)}</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingOrder(null)}>Cancel</Button>
            <Button onClick={saveEditItems} disabled={editSaving || editItems.length === 0}>
              {editSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Inline swap search for a single item */
function SwapSearch({ item, index, onSwap }: { item: OrderItem; index: number; onSwap: (i: number, p: Product) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return products.slice(0, 10);
    const q = query.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)).slice(0, 10);
  }, [query]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-primary hover:underline mt-2 block">
        Swap for different product
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input
          placeholder="Search to swap..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-7 text-xs pl-7"
          autoFocus
        />
      </div>
      <div className="max-h-32 overflow-y-auto space-y-0.5">
        {results.map(p => (
          <button
            key={p.id}
            onClick={() => { onSwap(index, p); setOpen(false); setQuery(""); }}
            className="w-full text-left px-2 py-1 text-xs rounded hover:bg-muted transition-colors"
          >
            <span className="font-medium">{p.brand}</span> — {p.name} (€{p.price.toFixed(2)})
          </button>
        ))}
      </div>
      <button onClick={() => { setOpen(false); setQuery(""); }} className="text-xs text-muted-foreground hover:underline">Cancel</button>
    </div>
  );
}
