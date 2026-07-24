import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/types/product';

export interface VariantStockOverride {
  ml: number;
  label?: string;
  inStock: boolean;
}

export interface StockOverride {
  in_stock: boolean | null;
  variants: VariantStockOverride[] | null;
}

const cache: Record<string, StockOverride> = {};
let fetchPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((fn) => fn());

export const fetchAllProductStockOverrides = async () => {
  if (fetchPromise) return fetchPromise;
  fetchPromise = (async () => {
    const { data } = await supabase
      .from('product_stock_overrides')
      .select('product_id, in_stock, variants');
    if (data) {
      data.forEach((row: any) => {
        cache[row.product_id] = {
          in_stock: typeof row.in_stock === 'boolean' ? row.in_stock : null,
          variants: Array.isArray(row.variants) ? row.variants : null,
        };
      });
      notify();
    }
  })();
  return fetchPromise;
};

export const saveProductStockOverride = async (
  productId: string,
  override: StockOverride
) => {
  cache[productId] = override;
  notify();
  const { error } = await supabase
    .from('product_stock_overrides')
    .upsert(
      {
        product_id: productId,
        in_stock: override.in_stock,
        variants: override.variants as any,
      },
      { onConflict: 'product_id' }
    );
  if (error) console.error('Failed to save stock override:', error);
};

export const useProductStockOverride = (productId: string): StockOverride | null => {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!fetchPromise) fetchAllProductStockOverrides();
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return cache[productId] || null;
};

/** Subscribe to all stock override changes (for list pages). */
export const useStockOverridesVersion = (): number => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!fetchPromise) fetchAllProductStockOverrides();
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return tick;
};

export const applyStockOverride = <T extends Product>(product: T): T => {
  const ov = cache[product.id];
  if (!ov) return product;
  const next: T = { ...product };
  if (typeof ov.in_stock === 'boolean') next.inStock = ov.in_stock;
  if (ov.variants && ov.variants.length && product.variants) {
    next.variants = product.variants.map((v) => {
      const match = ov.variants!.find(
        (o) => o.ml === v.ml && (o.label || '') === (v.label || '')
      );
      if (!match) return v;
      return { ...v, inStock: match.inStock };
    });
    // If every variant override marks out of stock and product flag isn't explicit, treat as out of stock
    if (typeof ov.in_stock !== 'boolean' && next.variants.every((v) => !v.inStock)) {
      next.inStock = false;
    } else if (typeof ov.in_stock !== 'boolean' && next.variants.some((v) => v.inStock)) {
      next.inStock = true;
    }
  }
  return next;
};
