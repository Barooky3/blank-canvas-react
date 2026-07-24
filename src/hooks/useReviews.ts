import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { homeReviews as seedReviews, HomeReview } from '@/data/homeReviews';

export const ADMIN_EMAIL = 'ewhz3384@gmail.com';

export interface DbReview {
  id: string;
  user_id: string | null;
  customer_name: string;
  rating: number;
  text: string | null;
  status: 'pending' | 'approved';
  is_admin_added: boolean;
  images: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface UnifiedReview {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
  verified: boolean;
  source: 'seed' | 'db';
  status?: 'pending' | 'approved';
  user_id?: string | null;
  isOwn?: boolean;
  images?: string[];
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const dbToUnified = (r: DbReview, currentUserId?: string | null): UnifiedReview => ({
  id: r.id,
  name: r.customer_name || 'Anonymous',
  rating: r.rating,
  text: r.text || '',
  date: formatDate(r.created_at),
  verified: true,
  source: 'db',
  status: r.status,
  user_id: r.user_id,
  isOwn: !!currentUserId && r.user_id === currentUserId,
  images: Array.isArray(r.images) ? r.images : [],
});

// ---------------- Shared settings store (DB-backed, with localStorage cache) ----------------

const SEED_OVERRIDES_KEY = 'parfumistry_seed_review_overrides';
const HIDDEN_SEEDS_KEY = 'parfumistry_hidden_seed_reviews';
const REVIEW_ORDER_KEY = 'parfumistry_review_order';

type SeedOverride = { name?: string; rating?: number; text?: string; images?: string[] };

interface ReviewSettings {
  order: string[];
  overrides: Record<string, SeedOverride>;
  hidden: string[];
}

const readLS = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeLS = (key: string, val: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};

const settingsState: ReviewSettings = {
  order: readLS<string[]>(REVIEW_ORDER_KEY, []),
  overrides: readLS<Record<string, SeedOverride>>(SEED_OVERRIDES_KEY, {}),
  hidden: readLS<string[]>(HIDDEN_SEEDS_KEY, []),
};

const listeners = new Set<() => void>();
const subscribeSettings = (cb: () => void) => {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
};
const notify = () => { listeners.forEach((l) => l()); };

let publicSeeds: UnifiedReview[] | null = null;

let remoteLoadPromise: Promise<void> | null = null;
const loadRemoteSettings = async (): Promise<void> => {
  if (remoteLoadPromise) return remoteLoadPromise;
  remoteLoadPromise = (async () => {
    // Try admin-scoped direct DB read first (works only for the primary admin
    // due to RLS). Falls back to the public edge function for everyone else.
    const { data, error } = await supabase
      .from('review_order' as any)
      .select('order_ids, seed_overrides, hidden_seeds')
      .eq('id', 1)
      .maybeSingle();

    if (!error && data) {
      const d = data as any;
      if (Array.isArray(d.order_ids)) settingsState.order = d.order_ids as string[];
      if (d.seed_overrides && typeof d.seed_overrides === 'object')
        settingsState.overrides = d.seed_overrides as Record<string, SeedOverride>;
      if (Array.isArray(d.hidden_seeds)) settingsState.hidden = d.hidden_seeds as string[];
      writeLS(REVIEW_ORDER_KEY, settingsState.order);
      writeLS(SEED_OVERRIDES_KEY, settingsState.overrides);
      writeLS(HIDDEN_SEEDS_KEY, settingsState.hidden);
      notify();
      return;
    }

    // Public path — overrides/hidden are not exposed; the edge function returns
    // the pre-processed visible seed list and the display order.
    try {
      const { data: fnData } = await supabase.functions.invoke('get-review-display');
      if (fnData && typeof fnData === 'object') {
        const d = fnData as any;
        if (Array.isArray(d.order_ids)) {
          settingsState.order = d.order_ids as string[];
          writeLS(REVIEW_ORDER_KEY, settingsState.order);
        }
        if (Array.isArray(d.seeds)) {
          publicSeeds = d.seeds as UnifiedReview[];
        }
        notify();
      }
    } catch {
      // keep cached values
    }
  })();
  return remoteLoadPromise;
};


const saveRemoteSettings = async (patch: Partial<{ order_ids: string[]; seed_overrides: Record<string, SeedOverride>; hidden_seeds: string[] }>) => {
  return supabase
    .from('review_order' as any)
    .upsert({ id: 1, ...patch, updated_at: new Date().toISOString() });
};

// Public sync getters (read current cache)
export const getSeedOverrides = (): Record<string, SeedOverride> => settingsState.overrides;
export const getHiddenSeedIds = (): string[] => settingsState.hidden;
export const getLocalReviewOrder = (): string[] => settingsState.order;

// Public mutations — update cache, persist locally, push to DB, notify subscribers
export const setSeedOverride = (id: string, patch: SeedOverride) => {
  const all = { ...settingsState.overrides };
  all[id] = { ...(all[id] || {}), ...patch };
  settingsState.overrides = all;
  writeLS(SEED_OVERRIDES_KEY, all);
  notify();
  void saveRemoteSettings({ seed_overrides: all });
};

export const hideSeedReview = (id: string) => {
  if (settingsState.hidden.includes(id)) return;
  const next = [...settingsState.hidden, id];
  settingsState.hidden = next;
  writeLS(HIDDEN_SEEDS_KEY, next);
  notify();
  void saveRemoteSettings({ hidden_seeds: next });
};

export const saveRemoteReviewOrder = async (ids: string[]) => {
  settingsState.order = ids;
  writeLS(REVIEW_ORDER_KEY, ids);
  notify();
  return saveRemoteSettings({ order_ids: ids });
};

const buildSeedAsUnified = (): UnifiedReview[] => {
  const overrides = getSeedOverrides();
  return seedReviews.map((r: HomeReview) => {
    const id = `seed-${r.id}`;
    const o = overrides[id] || {};
    return {
      id,
      name: o.name ?? r.name,
      rating: o.rating ?? r.rating,
      text: o.text ?? r.text,
      date: r.date,
      verified: r.verified,
      source: 'seed' as const,
      status: 'approved' as const,
      images: o.images,
    };
  });
};

export const applyReviewOrder = <T extends { id: string }>(items: T[], order: string[]): T[] => {
  if (!order || order.length === 0) return items;
  const idx = new Map(order.map((id, i) => [id, i]));
  return [...items].sort((a, b) => {
    const ai = idx.has(a.id) ? (idx.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
    const bi = idx.has(b.id) ? (idx.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });
};

export const fetchRemoteReviewOrder = async (): Promise<string[]> => {
  await loadRemoteSettings();
  return settingsState.order;
};

// Hook: subscribes to settings store and triggers loading from DB
const useReviewSettings = () => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = subscribeSettings(() => setTick((t) => t + 1));
    void loadRemoteSettings();
    return unsub;
  }, []);
  return settingsState;
};

export const useReviewOrder = () => {
  const s = useReviewSettings();
  const setOrder = (ids: string[]) => { void saveRemoteReviewOrder(ids); };
  return [s.order, setOrder] as const;
};


/**
 * Returns merged reviews (seed + db) visible to the current viewer.
 * - Anyone sees approved reviews
 * - Logged-in user additionally sees their own pending reviews
 * - Admin sees ALL db reviews
 */
export const useReviews = () => {
  const { user } = useAuth();
  const [dbReviews, setDbReviews] = useState<DbReview[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.email === ADMIN_EMAIL;
  // Subscribe to shared settings so this hook re-renders when overrides/hidden/order change
  useReviewSettings();

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setDbReviews(data as DbReview[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews, user?.id]);

  const allDbUnified = dbReviews.map((r) => dbToUnified(r, user?.id));

  // For the primary admin we use the raw overrides/hidden lists loaded from
  // the DB. Public visitors use the pre-processed list returned by the
  // get-review-display edge function, which never exposes which seeds are
  // hidden or which have been overridden.
  const visibleSeeds: UnifiedReview[] =
    publicSeeds && !isAdmin
      ? publicSeeds
      : buildSeedAsUnified().filter((r) => !getHiddenSeedIds().includes(r.id));

  // Public-facing list = approved db reviews + user's own pending + seed (minus admin-hidden)
  const visibleReviews: UnifiedReview[] = [
    ...allDbUnified.filter((r) => r.status === 'approved' || r.isOwn),
    ...visibleSeeds,
  ];

  return {
    visibleReviews,
    allDbReviews: dbReviews,
    pendingReviews: dbReviews.filter((r) => r.status === 'pending'),
    loading,
    refresh: fetchReviews,
    isAdmin,
    user,
  };
};

export const submitReview = async (params: {
  user_id: string;
  customer_name: string;
  customer_email?: string;
  rating: number;
  text: string;
  images?: string[];
}) => {
  return supabase.from('reviews').insert({
    user_id: params.user_id,
    customer_name: params.customer_name.slice(0, 80),
    rating: params.rating,
    text: params.text.slice(0, 1000) || null,
    status: 'pending',
    is_admin_added: false,
    images: params.images ?? [],
  });
};

export const adminAddReview = async (params: {
  customer_name: string;
  rating: number;
  text: string;
  images?: string[];
}) => {
  return supabase.from('reviews').insert({
    user_id: null,
    customer_name: params.customer_name.slice(0, 80),
    rating: params.rating,
    text: params.text.slice(0, 1000) || null,
    status: 'approved',
    is_admin_added: true,
    images: params.images ?? [],
  });
};

export const adminUpdateReview = async (
  id: string,
  patch: Partial<Pick<DbReview, 'customer_name' | 'rating' | 'text' | 'status'>>
) => supabase.from('reviews').update(patch).eq('id', id);

export const adminDeleteReview = async (id: string) =>
  supabase.from('reviews').delete().eq('id', id);

export const adminApproveReview = async (id: string) =>
  supabase.from('reviews').update({ status: 'approved' }).eq('id', id);
