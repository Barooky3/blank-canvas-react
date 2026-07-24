import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PaddingOverride {
  padding_top: number;
  padding_right: number;
  padding_bottom: number;
  padding_left: number;
  scale: number;
}

const cache: Record<string, PaddingOverride> = {};
let fetchPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach(fn => fn());

export const fetchAllPaddingOverrides = async () => {
  // Singleton promise prevents duplicate fetches
  if (fetchPromise) return fetchPromise;
  
  fetchPromise = (async () => {
    const { data } = await supabase
      .from('product_padding_overrides')
      .select('product_id, padding_top, padding_right, padding_bottom, padding_left, scale');
    if (data) {
      data.forEach((row: any) => {
        cache[row.product_id] = {
          padding_top: Number(row.padding_top),
          padding_right: Number(row.padding_right),
          padding_bottom: Number(row.padding_bottom),
          padding_left: Number(row.padding_left),
          scale: Number(row.scale) || 1,
        };
      });
      notify();
    }
  })();
  
  return fetchPromise;
};

export const savePaddingOverride = async (productId: string, padding: PaddingOverride) => {
  cache[productId] = padding;
  notify();
  
  // Use admin edge function for server-side authorization
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    console.error('No auth session for padding save');
    return;
  }
  
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const res = await fetch(`https://${projectId}.supabase.co/functions/v1/admin-padding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      product_id: productId,
      ...padding,
    }),
  });
  
  if (!res.ok) {
    console.error('Failed to save padding:', await res.text());
  }
};

export const useProductPadding = (productId: string): PaddingOverride | null => {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!fetchPromise) fetchAllPaddingOverrides();
    const listener = () => setTick(t => t + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return cache[productId] || null;
};

export const computePaddingAndScale = (override: PaddingOverride | null) => {
  if (!override) return { innerStyle: undefined, hasOverride: false };
  
  const hasAny = override.padding_top !== 0 || override.padding_right !== 0 || override.padding_bottom !== 0 || override.padding_left !== 0 || override.scale !== 1;
  if (!hasAny) return { innerStyle: undefined, hasOverride: false };

  const imageScale = override.scale;
  // Position with translate, then scale purely around the element's own center so
  // changing scale only makes the bottle bigger/smaller in place — it never drifts.
  // CSS transforms apply right-to-left: scale first (around center), then translate.
  const translateX = (override.padding_left - override.padding_right) * 2.5;
  const translateY = (override.padding_top - override.padding_bottom) * 2.5;

  const innerStyle: React.CSSProperties = {
    transform: `translate(${translateX}%, ${translateY}%) scale(${imageScale})`,
    transformOrigin: 'center center',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  };

  return { innerStyle, hasOverride: true };
};
