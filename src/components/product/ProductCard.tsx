import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Product } from '@/types/product';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useProductPadding, computePaddingAndScale } from '@/hooks/useProductPadding';
import { useDisplayName } from '@/hooks/useProductName';
import { applyStockOverride, useProductStockOverride } from '@/hooks/useProductStock';
import { applyPriceOverride, useProductPriceOverride } from '@/hooks/useProductPrice';
import { PaddingAdjuster } from '@/components/admin/PaddingAdjuster';
import { NameEditor } from '@/components/admin/NameEditor';
import { StockEditor } from '@/components/admin/StockEditor';

interface ProductCardProps {
  product: Product;
  className?: string;
  /** Image aspect ratio. Defaults to portrait (3/4). Pass "square" for 1:1. */
  imageAspect?: 'portrait' | 'square';
  /** Override the image container background (e.g. for New Arrivals pink). */
  imageBgClassName?: string;
  /** Hide the FOR HIM / FOR HER / BUNDLE corner badge (used when caller renders its own overlay badge). */
  hideCategoryBadge?: boolean;
  /** Apply classes to the image wrapper only (not the text content below). */
  imageWrapperClassName?: string;
  /** Namespace the padding/scale override so this placement is independent (e.g. "new-arrivals"). */
  paddingContext?: string;
}

export const ProductCard = forwardRef<HTMLDivElement, ProductCardProps>(
  ({ product: rawProduct, className, imageAspect = 'portrait', imageBgClassName, hideCategoryBadge, imageWrapperClassName, paddingContext }, ref) => {

    const { formatPrice } = useCurrency();
    const { t } = useLanguage();
    const { user } = useAuth();
    // Subscribe so card re-renders on stock changes
    useProductStockOverride(rawProduct.id);
    useProductPriceOverride(rawProduct.id);
    const product = applyStockOverride(applyPriceOverride(rawProduct));
    const paddingKey = paddingContext ? `${product.id}::${paddingContext}` : product.id;
    const paddingOverride = useProductPadding(paddingKey);
    const displayName = useDisplayName(product.id, product.name);

    const ADMIN_EMAILS = ["ewhz3384@gmail.com"];
    const isAdmin = user && ADMIN_EMAILS.includes(user.email || "");

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPercent = hasDiscount
      ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
      : 0;

    // Get top 3 scent notes to display (combine all types)
    const getScentNotesDisplay = () => {
      if (!product.scentNotes) return null;
      const allNotes = [
        ...(product.scentNotes.top || []),
        ...(product.scentNotes.heart || []),
        ...(product.scentNotes.base || []),
      ];
      return allNotes.slice(0, 3);
    };

    const scentNotes = getScentNotesDisplay();
    const isBundle = product.isBundle || product.category === 'bundle';

    return (
      <motion.div
        ref={ref}
        className={cn(
          'group relative',
          isBundle && 'ring-2 ring-accent rounded-md',
          className
        )}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Bundle Star Badge */}
        {isBundle && (
          <div className="absolute -top-2 -left-2 z-40 bg-accent text-accent-foreground rounded-full p-1.5 shadow-md">
            <Star size={14} fill="currentColor" />
          </div>
        )}
        {/* Image Container */}
        <Link
          to={`/product/${product.id}`}
          className={cn('block relative mb-2.5', imageWrapperClassName)}
        >
         {(() => {
            const { innerStyle, hasOverride } = computePaddingAndScale(paddingOverride);
            return (
              <div 
                className={cn(
                  imageAspect === 'square' ? 'aspect-square' : 'aspect-[3/4]',
                  'rounded-sm flex items-end justify-center relative overflow-hidden',
                  imageBgClassName || 'bg-secondary',
                  !hasOverride && product.imagePadding
                )}
              >
                {isAdmin && <PaddingAdjuster productId={paddingKey} productName={paddingContext ? `${displayName} · ${paddingContext}` : displayName} />}
                {isAdmin && <NameEditor productId={product.id} originalName={product.name} />}
                {isAdmin && <StockEditor product={rawProduct} variant="card" />}
                {product.bundleImages && product.bundleImages.length > 0 ? (
                  <div className="relative w-full h-full" style={innerStyle || undefined}>
                    <motion.img
                      src={product.bundleImages[0]}
                      alt={`${product.name} item 1`}
                      className="absolute top-[8%] left-[2%] h-[60%] w-auto object-contain drop-shadow-md z-10"
                      loading="lazy"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.5 }}
                    />
                    <motion.img
                      src={product.bundleImages[2]}
                      alt={`${product.name} item 3`}
                      className="absolute top-[8%] right-[2%] h-[60%] w-auto object-contain drop-shadow-md z-10"
                      loading="lazy"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.5 }}
                    />
                    <motion.img
                      src={product.bundleImages[1]}
                      alt={`${product.name} item 2`}
                      className="absolute bottom-[4%] left-1/2 -translate-x-1/2 h-[65%] w-auto object-contain drop-shadow-lg z-20"
                      loading="lazy"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                ) : (
                  <div style={innerStyle || undefined} className="w-full h-full flex items-end justify-center">
                    <motion.img
                      src={product.image}
                      alt={product.name}
                      className={cn("w-full h-full", (product.imagePadding || hasOverride) ? "object-contain object-bottom" : "object-cover")}
                      loading="lazy"
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                    />
                  </div>
                )}
              </div>
            );
          })()}
          
          {/* Category Badge */}
          {!hideCategoryBadge && (
            <span className="absolute top-2 left-2 text-[9px] font-medium tracking-[0.08em] px-2 py-1 bg-background/90 text-foreground uppercase">
              {product.category === 'men' ? t('product.forHim') : product.category === 'women' ? t('product.forHer') : product.category === 'bundle' ? t('product.bundle') : t('product.unisex')}
            </span>
          )}

          
          {/* Hot Deal Fire Badge */}
          {product.hotDeal && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
              <div className="relative flex items-center justify-center gap-1.5">
                <div className="absolute inset-0 rounded-full bg-destructive/20 blur-xl scale-[2]" />
                <Flame size={22} className="text-destructive drop-shadow-[0_0_10px_hsl(var(--destructive)/0.8)] animate-pulse" strokeWidth={2.5} />
                <span className="text-[9px] font-bold uppercase tracking-wider text-destructive drop-shadow-[0_0_8px_hsl(var(--destructive)/0.6)] animate-pulse whitespace-nowrap">
                  Temporarily Cheaper
                </span>
              </div>
            </div>
          )}

          {/* Discount Badge */}
          {hasDiscount && (
            <span className="absolute top-2 right-2 bg-accent text-accent-foreground text-[9px] font-semibold px-1.5 py-0.5">
              -{discountPercent}%
            </span>
          )}

          {/* Out of Stock Overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-foreground">{t('product.soldOut')}</span>
            </div>
          )}
        </Link>

        {/* Content - Compact */}
        <div className="space-y-1.5">
          <Link to={`/product/${product.id}`}>
            <h3 className="text-xs font-medium text-foreground group-hover:text-accent transition-colors leading-tight line-clamp-2">
              {displayName}
            </h3>
          </Link>

          {/* Scent Notes */}
          {scentNotes && scentNotes.length > 0 && (
            <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
              {scentNotes.join(' · ')}
            </p>
          )}

          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-foreground">
              {formatPrice(product.price)}
            </span>
            {product.variants && product.variants.length > 0 && (
              <span className="text-[10px] text-muted-foreground">
                / {product.variants[0].ml}ml
              </span>
            )}
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.originalPrice!)}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);

ProductCard.displayName = 'ProductCard';
