import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Tag, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Product } from '@/types/product';
import {
  saveProductPriceOverride,
  deleteProductPriceOverride,
  useProductPriceOverride,
} from '@/hooks/useProductPrice';

interface PriceEditorProps {
  product: Product;
}

const toStr = (n: number | undefined | null): string =>
  n === undefined || n === null || Number.isNaN(n) ? '' : String(n);

const parseNum = (s: string): number | null => {
  const t = s.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

export const PriceEditor = ({ product }: PriceEditorProps) => {
  const override = useProductPriceOverride(product.id);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [basePrice, setBasePrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [variantPrices, setVariantPrices] = useState<
    Array<{ price: string; originalPrice: string }>
  >([]);

  useEffect(() => {
    if (!open) return;
    setBasePrice(toStr(override?.base_price ?? product.price));
    setOriginalPrice(toStr(override?.original_price ?? product.originalPrice));
    setVariantPrices(
      (product.variants || []).map((v, i) => {
        const ov = override?.variants?.[i];
        return {
          price: toStr(ov?.price ?? v.price),
          originalPrice: toStr(ov?.originalPrice ?? v.originalPrice),
        };
      })
    );
  }, [open, override, product]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const hasVariants = !!(product.variants && product.variants.length);

  const handleSave = async () => {
    setSaving(true);
    const variants = hasVariants
      ? product.variants!.map((v, i) => ({
          ...v,
          price: parseNum(variantPrices[i]?.price ?? '') ?? v.price,
          originalPrice:
            parseNum(variantPrices[i]?.originalPrice ?? '') ?? undefined,
        }))
      : null;
    await saveProductPriceOverride(product.id, {
      base_price: hasVariants ? null : parseNum(basePrice),
      original_price: hasVariants ? null : parseNum(originalPrice),
      variants,
    });
    setSaving(false);
    setOpen(false);
  };

  const handleReset = async () => {
    setSaving(true);
    await deleteProductPriceOverride(product.id);
    setSaving(false);
    setOpen(false);
  };

  const stopAll = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const triggerBtn = (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 ml-2 text-[10px] font-medium uppercase tracking-wider bg-amber-500 text-black rounded-sm hover:bg-amber-400 transition-colors shadow"
      title="Edit prices (admin)"
    >
      <Tag className="w-3 h-3" />
      Edit prices
    </button>
  );

  if (!open) return triggerBtn;

  const panel = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70"
      onClick={(e) => {
        stopAll(e);
        setOpen(false);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="relative w-[420px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto bg-neutral-900 border border-white/15 rounded-lg shadow-2xl p-5 flex flex-col gap-4"
        onClick={stopAll}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-2 right-2 text-white/70 hover:text-white p-1"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="pr-6">
          <p className="text-xs text-white/60 uppercase tracking-wider mb-1">
            Edit prices
          </p>
          <p className="text-[11px] text-white/40 truncate">{product.name}</p>
        </div>

        {!hasVariants && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-white/70 mb-1.5 block">
                Base price (€)
              </label>
              <Input
                inputMode="decimal"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="bg-neutral-800 border-white/20 text-white"
                placeholder={toStr(product.price)}
              />
            </div>
            <div>
              <label className="text-[11px] text-white/70 mb-1.5 block">
                Compare-at (€)
              </label>
              <Input
                inputMode="decimal"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="bg-neutral-800 border-white/20 text-white"
                placeholder={toStr(product.originalPrice)}
              />
            </div>
          </div>
        )}

        {product.variants && product.variants.length > 0 && (
          <div className="border-t border-white/10 pt-3">
            <p className="text-[11px] text-white/60 uppercase tracking-wider mb-2">
              Variants
            </p>
            <div className="space-y-2">
              {product.variants.map((v, i) => (
                <div
                  key={`${v.ml}-${v.label || 'std'}-${i}`}
                  className="grid grid-cols-[64px_1fr_1fr] gap-2 items-center"
                >
                  <span className="text-[11px] text-white/70">
                    {v.label || `${v.ml}ml`}
                  </span>
                  <Input
                    inputMode="decimal"
                    value={variantPrices[i]?.price ?? ''}
                    onChange={(e) =>
                      setVariantPrices((prev) => {
                        const next = [...prev];
                        next[i] = { ...next[i], price: e.target.value };
                        return next;
                      })
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="h-9 bg-neutral-800 border-white/20 text-white text-sm"
                    placeholder={`Price ${toStr(v.price)}`}
                  />
                  <Input
                    inputMode="decimal"
                    value={variantPrices[i]?.originalPrice ?? ''}
                    onChange={(e) =>
                      setVariantPrices((prev) => {
                        const next = [...prev];
                        next[i] = { ...next[i], originalPrice: e.target.value };
                        return next;
                      })
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="h-9 bg-neutral-800 border-white/20 text-white text-sm"
                    placeholder={`Compare ${toStr(v.originalPrice)}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            disabled={saving || !override}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5"
            title="Reset to original prices"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-white/70 hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-400 text-black"
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {triggerBtn}
      {typeof document !== 'undefined' && createPortal(panel, document.body)}
    </>
  );
};
