import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductVariant } from '@/types/product';

export interface PriceOverride {
  base_price: number | null;
  original_price: number | null;
  variants: ProductVariant[] | null;
}

const cache: Record<string, PriceOverride> = {};
let fetchPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((fn) => fn());

export const fetchAllProductPriceOverrides = async () => {
  if (fetchPromise) return fetchPromise;
  fetchPromise = (async () => {
    const { data } = await supabase
      .from('product_price_overrides')
      .select('product_id, base_price, original_price, variants');
    if (data) {
      data.forEach((row: any) => {
        cache[row.product_id] = {
          base_price: row.base_price !== null ? Number(row.base_price) : null,
          original_price: row.original_price !== null ? Number(row.original_price) : null,
          variants: Array.isArray(row.variants) ? row.variants : null,
        };
      });
      notify();
    }
  })();
  return fetchPromise;
};

export const saveProductPriceOverride = async (
  productId: string,
  override: PriceOverride
) => {
  cache[productId] = override;
  notify();
  const { error } = await supabase
    .from('product_price_overrides')
    .upsert(
      {
        product_id: productId,
        base_price: override.base_price,
        original_price: override.original_price,
        variants: override.variants as any,
      },
      { onConflict: 'product_id' }
    );
  if (error) console.error('Failed to save price override:', error);
};

export const deleteProductPriceOverride = async (productId: string) => {
  delete cache[productId];
  notify();
  const { error } = await supabase
    .from('product_price_overrides')
    .delete()
    .eq('product_id', productId);
  if (error) console.error('Failed to delete price override:', error);
};

export const useProductPriceOverride = (productId: string): PriceOverride | null => {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!fetchPromise) fetchAllProductPriceOverrides();
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return cache[productId] || null;
};

export const applyPriceOverride = <T extends Product>(product: T): T => {
  const ov = cache[product.id];
  const next: T = { ...product };
  if (ov) {
    if (ov.base_price !== null && ov.base_price !== undefined) next.price = ov.base_price;
    if (ov.original_price !== null && ov.original_price !== undefined) {
      next.originalPrice = ov.original_price;
    }
    if (ov.variants && ov.variants.length && product.variants) {
      next.variants = product.variants.map((v, i) => {
        const o = ov.variants?.[i];
        if (!o) return v;
        return {
          ...v,
          price: typeof o.price === 'number' ? o.price : v.price,
          originalPrice:
            typeof o.originalPrice === 'number' ? o.originalPrice : v.originalPrice,
        };
      });
    }
  }
  // Always sync the outside (card) price to the first variant (the one displayed outside)
  if (next.variants && next.variants.length) {
    const displayed = next.variants[0];
    next.price = displayed.price;
    if (displayed.originalPrice !== undefined) {
      next.originalPrice = displayed.originalPrice;
    }
  }
  return next;
};
