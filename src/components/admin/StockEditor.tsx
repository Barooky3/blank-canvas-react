import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import type { Product } from '@/types/product';
import {
  saveProductStockOverride,
  useProductStockOverride,
  type VariantStockOverride,
} from '@/hooks/useProductStock';

interface StockEditorProps {
  product: Product;
  variant?: 'detail' | 'card';
}

export const StockEditor = ({ product, variant = 'card' }: StockEditorProps) => {
  const [open, setOpen] = useState(false);
  const override = useProductStockOverride(product.id);

  const baseInStock =
    typeof override?.in_stock === 'boolean' ? override.in_stock : product.inStock;

  const buildVariantState = (): VariantStockOverride[] =>
    (product.variants || []).map((v) => {
      const o = override?.variants?.find(
        (x) => x.ml === v.ml && (x.label || '') === (v.label || '')
      );
      return {
        ml: v.ml,
        label: v.label,
        inStock: typeof o?.inStock === 'boolean' ? o.inStock : v.inStock,
      };
    });

  const [productInStock, setProductInStock] = useState<boolean>(baseInStock);
  const [variantStocks, setVariantStocks] = useState<VariantStockOverride[]>(buildVariantState());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setProductInStock(baseInStock);
      setVariantStocks(buildVariantState());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProductStockOverride(product.id, {
        in_stock: productInStock,
        variants: variantStocks.length ? variantStocks : null,
      });
      toast({ title: 'Stock updated', description: product.name });
      setOpen(false);
    } catch (e) {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateVariant = (idx: number, inStock: boolean) => {
    setVariantStocks((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, inStock } : v))
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={
          variant === 'detail'
            ? 'absolute top-2 right-14 z-50 bg-background/90 hover:bg-background border border-border rounded-full p-2 shadow-md'
            : 'absolute top-2 right-9 z-40 bg-background/90 hover:bg-background border border-border rounded-full p-1.5 shadow-md'
        }
        aria-label="Edit stock"
        title="Edit stock"
      >
        <Package className="h-3.5 w-3.5 text-foreground" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Stock · {product.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <Label className="text-sm font-medium">Product available</Label>
                <p className="text-xs text-muted-foreground">
                  Master toggle for the whole product
                </p>
              </div>
              <Switch checked={productInStock} onCheckedChange={setProductInStock} />
            </div>

            {variantStocks.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Variants
                </p>
                {variantStocks.map((v, i) => (
                  <div key={`${v.ml}-${v.label || ''}-${i}`} className="flex items-center justify-between">
                    <Label className="text-sm">
                      {v.label || `${v.ml}ml`}
                    </Label>
                    <Switch
                      checked={v.inStock}
                      onCheckedChange={(c) => updateVariant(i, c)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
