import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { getFragrances } from '@/data/products';
import { Product, ProductVariant } from '@/types/product';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { X, Sparkles, Plus, Search, ShoppingBag, Tag } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAllProductNameOverrides } from '@/hooks/useProductName';
import { useProductPadding, computePaddingAndScale } from '@/hooks/useProductPadding';
import { applyPriceOverride, useProductPriceOverride } from '@/hooks/useProductPrice';
import { applyStockOverride, useStockOverridesVersion } from '@/hooks/useProductStock';

interface BundleProductImageProps {
  product: Product;
  alt: string;
  isDisabled: boolean;
  isOutOfStock: boolean;
}

const BundleProductImage = ({ product, alt, isDisabled, isOutOfStock }: BundleProductImageProps) => {
  const override = useProductPadding(product.id);
  const { innerStyle, hasOverride } = computePaddingAndScale(override);
  return (
    <div style={innerStyle || undefined} className="w-full h-full flex items-end justify-center">
      <img
        src={product.image}
        alt={alt}
        className={cn(
          "w-full h-full transition-transform duration-300",
          hasOverride ? "object-contain object-bottom" : "object-contain",
          !isDisabled && "group-hover:scale-105",
          isOutOfStock && "grayscale"
        )}
        loading="lazy"
      />
    </div>
  );
};


const STORAGE_PREFIX = 'custom-bundle:';

const MAX_ITEMS = 5;

// Designer brands that should appear first (shuffled among themselves)
const DESIGNER_BRANDS = [
  'Dior', 'Tom Ford', 'Louis Vuitton', 'Creed', 'Prada', 'Valentino',
  'Giorgio Armani', 'Jean Paul Gaultier', 'Versace', 'Viktor & Rolf',
  'Paco Rabanne', 'Yves Saint Laurent', 'Parfums de Marly', 'Xerjoff',
];

interface BundleSelection {
  product: Product;
  variant: ProductVariant;
  bundlePrice: number;
}

const getBundlePrice = (variantPrice: number): number => {
  return Math.round(variantPrice * 0.55 * 100) / 100;
};

// Eligible variants: in stock and not testers
const isTesterVariant = (v: ProductVariant) => /tester/i.test(v.label || '');
const getEligibleVariants = (product: Product): ProductVariant[] => {
  if (!product.variants || product.variants.length === 0) return [];
  return product.variants.filter((v) => v.inStock && !isTesterVariant(v));
};

// Seeded shuffle so order is stable per session but random
const shuffleArray = <T,>(arr: T[], seed: number): T[] => {
  const shuffled = [...arr];
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const SESSION_SEED = Math.floor(Math.random() * 2147483647);

const CustomBundle = () => {
  const [selectionRefs, setSelectionRefs] = useState<Array<{ productId: string; ml: number }>>([]);
  const [bundleName, setBundleName] = useState('');
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addItem } = useCart();
  const nameOverrides = useAllProductNameOverrides();
  // Subscribe to price override cache changes so prices update live after admin edits
  useProductPriceOverride('__custom_bundle_subscription__');
  // Subscribe to stock override changes so manually-set out-of-stock variants reflect here
  useStockOverridesVersion();
  const displayName = (p: Product) => nameOverrides[p.id] || p.name;

  // Rehydrate from a previously added custom bundle (cart link with ?edit=id)
  useEffect(() => {
    const id = searchParams.get('edit');
    if (!id) return;
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + id);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        bundleName?: string;
        items: Array<{ productId: string; ml: number }>;
      };
      if (saved.items?.length) {
        setSelectionRefs(saved.items.map((it) => ({ productId: it.productId, ml: it.ml })));
        setBundleName(saved.bundleName || '');
        setEditId(id);
      }
    } catch {
      // ignore
    }
  }, [searchParams]);


  // Apply current price + stock overrides to all fragrances (re-runs when overrides change)
  const fragrances = (() => {
    const all = getFragrances()
      .filter(p => p.variants && p.variants.length > 0)
      .map(applyPriceOverride)
      .map(applyStockOverride);
    const designers = all.filter(p => DESIGNER_BRANDS.includes(p.brand));
    const others = all.filter(p => !DESIGNER_BRANDS.includes(p.brand));
    return [...shuffleArray(designers, SESSION_SEED), ...shuffleArray(others, SESSION_SEED + 1)];
  })();

  // Resolve selection refs against current (override-applied) fragrances so bundle
  // prices are always a direct percentage of the live variant price.
  const selections: BundleSelection[] = useMemo(() => {
    return selectionRefs
      .map((ref) => {
        const product = fragrances.find((p) => p.id === ref.productId);
        if (!product || !product.variants) return null;
        const variant = product.variants.find((v) => v.ml === ref.ml) || product.variants[0];
        if (!variant) return null;
        return { product, variant, bundlePrice: getBundlePrice(variant.price) };
      })
      .filter((s): s is BundleSelection => s !== null);
  }, [selectionRefs, fragrances]);

  const filteredFragrances = useMemo(() => {
    if (!search.trim()) return fragrances;
    const q = search.toLowerCase();
    return fragrances.filter(p =>
      displayName(p).toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
    );
  }, [fragrances, search, nameOverrides]);

  const totalPrice = selections.reduce((sum, s) => sum + s.bundlePrice, 0);
  const totalOriginal = selections.reduce((sum, s) => sum + s.variant.price, 0);
  const totalSavings = totalOriginal - totalPrice;

  const handleSelect = (product: Product, variant: ProductVariant) => {
    if (selections.length >= MAX_ITEMS) return;
    if (!product.inStock) return;
    if (!variant.inStock || isTesterVariant(variant)) return;
    setSelectionRefs(prev => [...prev, { productId: product.id, ml: variant.ml }]);
  };

  const handleRemove = (index: number) => {
    setSelectionRefs(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddToCart = () => {
    const id = editId || `custom-bundle-${Date.now()}`;
    const bundleProduct: Product = {
      id,
      name: (bundleName.trim() || 'Custom Bundle') + ' (' + selections.map(s => displayName(s.product)).join(', ') + ')',
      brand: 'Parfumistry',
      price: totalPrice,
      category: 'bundle',
      description: `Custom bundle: ${selections.map(s => `${displayName(s.product)} ${s.variant.ml}ml`).join(', ')}`,
      image: selections[0]?.product.image || '',
      affiliateUrl: '',
      inStock: true,
      isBundle: true,
    };
    try {
      localStorage.setItem(
        STORAGE_PREFIX + id,
        JSON.stringify({
          bundleName,
          items: selections.map((s) => ({ productId: s.product.id, ml: s.variant.ml })),
        })
      );
    } catch {
      // ignore quota errors
    }
    addItem(bundleProduct, undefined, totalPrice);
    navigate('/');
  };



  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 md:py-14">
        {/* Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl md:text-5xl text-foreground mb-3">
            Create Your Own Bundle
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
            Pick 5 fragrances and craft your perfect collection
          </p>
        </motion.div>

        {/* Name your bundle card */}
        <motion.div
          className="max-w-lg mx-auto mb-10 rounded-lg border-2 border-accent/40 bg-accent/5 p-6 text-center"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles size={18} className="text-accent" />
            <span className="text-sm font-semibold uppercase tracking-widest text-foreground">
              Name Your Bundle
            </span>
          </div>
          <input
            type="text"
            value={bundleName}
            onChange={(e) => setBundleName(e.target.value)}
            placeholder="e.g. Summer Vibes, Night Out, My Collection..."
            maxLength={40}
            className="w-full text-center bg-background border border-border rounded-md px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/60 transition-shadow"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Give your bundle a personal touch!
          </p>
        </motion.div>

        {/* Sticky summary bar */}
        <motion.div
          className="sticky top-16 z-30 bg-secondary/80 backdrop-blur-md border border-border rounded-lg py-4 px-5 mb-8 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-accent" />
              <span className="text-sm font-semibold text-foreground">
                {selections.length}/{MAX_ITEMS} selected
              </span>
              <div className="flex gap-1.5">
                {Array.from({ length: MAX_ITEMS }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all duration-300",
                      i < selections.length
                        ? "bg-accent scale-110"
                        : "bg-muted-foreground/20"
                    )}
                  />
                ))}
              </div>
              {/* Savings badge */}
              {selections.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1 bg-accent/15 text-accent px-2.5 py-1 rounded-full text-xs font-semibold"
                >
                  <Tag size={12} />
                  You save €{totalSavings.toFixed(2)}
                </motion.div>
              )}
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={selections.length !== MAX_ITEMS}
              className="rounded-md text-xs uppercase tracking-widest gap-2"
              size="sm"
            >
              <ShoppingBag size={14} />
              Add to Cart — €{totalPrice.toFixed(2)}
            </Button>
          </div>

          {/* Selected items pills */}
          {selections.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              <AnimatePresence>
                {selections.map((sel, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5 bg-background text-foreground text-xs px-3 py-1.5 rounded-full border border-border shadow-sm"
                  >
                    <span className="max-w-[120px] truncate">{displayName(sel.product)}</span>
                    <span className="text-muted-foreground">({sel.variant.ml}ml)</span>
                    <button
                      onClick={() => handleRemove(i)}
                      className="ml-1 hover:text-destructive transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Search bar */}
        <div className="max-w-lg mx-auto mb-8">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fragrances..."
              className="w-full bg-secondary border border-border rounded-md pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/60 transition-shadow"
            />
          </div>
        </div>

        {/* Fragrance grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFragrances.map((product) => {
            const timesSelected = selections.filter(s => s.product.id === product.id).length;
            const isFull = selections.length >= MAX_ITEMS;
            const eligibleVariants = getEligibleVariants(product);
            const isOutOfStock = !product.inStock || eligibleVariants.length === 0;
            const isDisabled = isFull || isOutOfStock;

            return (
              <motion.div
                key={product.id}
                className={cn(
                  "border border-border bg-background overflow-hidden transition-all group relative flex flex-col",
                  timesSelected > 0 && "ring-2 ring-accent",
                  isDisabled && timesSelected === 0 && "opacity-50"
                )}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
              >
                {/* Image */}
                <div className="aspect-square bg-secondary flex items-center justify-center p-4 relative overflow-hidden">
                  <BundleProductImage
                    product={product}
                    alt={displayName(product)}
                    isDisabled={isDisabled}
                    isOutOfStock={isOutOfStock}
                  />
                  {timesSelected > 0 && (
                    <div className="absolute top-2 right-2 bg-accent text-accent-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md">
                      {timesSelected}
                    </div>
                  )}
                  {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-background/90 px-3 py-1.5 rounded-md border border-border">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                      {product.brand}
                    </p>
                    <h3 className="text-sm font-medium text-foreground line-clamp-1">
                      {displayName(product)}
                    </h3>
                  </div>

                  {!isOutOfStock && (
                    <div className="mt-auto space-y-1.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Choose size
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {eligibleVariants.map((v) => {
                          const bp = getBundlePrice(v.price);
                          const disabledBtn = isFull;
                          return (
                            <button
                              key={`${v.ml}-${v.label || ''}`}
                              type="button"
                              disabled={disabledBtn}
                              onClick={() => handleSelect(product, v)}
                              className={cn(
                                "flex-1 min-w-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md border text-[11px] transition-all",
                                disabledBtn
                                  ? "border-border bg-secondary/40 text-muted-foreground cursor-not-allowed"
                                  : "border-border bg-secondary hover:border-accent hover:bg-accent/10 cursor-pointer"
                              )}
                            >
                              <span className="font-semibold text-foreground">{v.ml}ml</span>
                              <span className="flex items-center gap-1 leading-none">
                                <span className="line-through text-muted-foreground text-[9px]">€{v.price.toFixed(0)}</span>
                                <span className="font-bold text-accent">€{bp.toFixed(2)}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="text-[10px] font-semibold text-accent uppercase tracking-wider text-center">
                        Save 45%
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredFragrances.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">No fragrances found matching "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomBundle;
