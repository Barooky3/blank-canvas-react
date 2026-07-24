import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const cache: Record<string, string> = {};
let fetchPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((fn) => fn());

export const fetchAllProductDescriptionOverrides = async () => {
  if (fetchPromise) return fetchPromise;
  fetchPromise = (async () => {
    const { data } = await supabase
      .from('product_description_overrides')
      .select('product_id, description');
    if (data) {
      data.forEach((row: any) => {
        cache[row.product_id] = row.description;
      });
      notify();
    }
  })();
  return fetchPromise;
};

export const saveProductDescriptionOverride = async (productId: string, description: string) => {
  const trimmed = description.trim();
  if (!trimmed) {
    delete cache[productId];
    notify();
    const { error } = await supabase
      .from('product_description_overrides')
      .delete()
      .eq('product_id', productId);
    if (error) console.error('Failed to delete description override:', error);
    return;
  }
  cache[productId] = trimmed;
  notify();
  const { error } = await supabase
    .from('product_description_overrides')
    .upsert({ product_id: productId, description: trimmed }, { onConflict: 'product_id' });
  if (error) console.error('Failed to save description override:', error);
};

export const useProductDescriptionOverride = (productId: string): string | null => {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!fetchPromise) fetchAllProductDescriptionOverrides();
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return cache[productId] || null;
};

export const useDisplayDescription = (productId: string, fallback: string): string => {
  const override = useProductDescriptionOverride(productId);
  return override || fallback;
};
