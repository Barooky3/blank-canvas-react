import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const cache: Record<string, string> = {};
let fetchPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((fn) => fn());

export const fetchAllProductNameOverrides = async () => {
  if (fetchPromise) return fetchPromise;
  fetchPromise = (async () => {
    const { data } = await supabase
      .from('product_name_overrides')
      .select('product_id, name');
    if (data) {
      data.forEach((row: any) => {
        cache[row.product_id] = row.name;
      });
      notify();
    }
  })();
  return fetchPromise;
};

export const saveProductNameOverride = async (productId: string, name: string) => {
  const trimmed = name.trim();
  if (!trimmed) {
    delete cache[productId];
    notify();
    const { error } = await supabase
      .from('product_name_overrides')
      .delete()
      .eq('product_id', productId);
    if (error) console.error('Failed to delete name override:', error);
    return;
  }
  cache[productId] = trimmed;
  notify();
  const { error } = await supabase
    .from('product_name_overrides')
    .upsert({ product_id: productId, name: trimmed }, { onConflict: 'product_id' });
  if (error) console.error('Failed to save name override:', error);
};

export const useProductNameOverride = (productId: string): string | null => {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!fetchPromise) fetchAllProductNameOverrides();
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return cache[productId] || null;
};

export const useAllProductNameOverrides = (): Record<string, string> => {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!fetchPromise) fetchAllProductNameOverrides();
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return cache;
};

export const useDisplayName = (productId: string, fallback: string): string => {
  const override = useProductNameOverride(productId);
  return override || fallback;
};
