import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { getBundles } from '@/data/products';
import { useProductPadding, computePaddingAndScale } from '@/hooks/useProductPadding';
import { PaddingAdjuster } from '@/components/admin/PaddingAdjuster';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import React from 'react';

const ADMIN_EMAILS = ['ewhz3384@gmail.com'];

const BUNDLE_TAGS: Record<string, string> = {
  'evening-sweetheart-bundle': 'Winter',
  'young-playboy-bundle': 'Winter & Summer',
  'sleek-and-clean-bundle': 'Summer',
  'jpg-bundle': 'All Seasons',
};

const getBundleTag = (id: string): string | undefined => BUNDLE_TAGS[id];

const BundleCard = ({ bundle, index }: { bundle: any; index: number }) => {
  const { user } = useAuth();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');
  const paddingOverride = useProductPadding(bundle.id);
  const { innerStyle, hasOverride } = computePaddingAndScale(paddingOverride);

  return (
    <motion.div 
      key={bundle.id}
      className="group bg-background border border-border overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link to={`/product/${bundle.id}`} className="block">
        {getBundleTag(bundle.id) && (
          <div className="bg-accent text-accent-foreground text-[10px] md:text-xs font-semibold tracking-wide uppercase px-3 py-2 text-center">
            {getBundleTag(bundle.id)}
          </div>
        )}
        <div 
          className={cn(
            "aspect-[3/4] bg-secondary rounded-sm flex items-end justify-center relative overflow-hidden",
            !hasOverride && bundle.imagePadding
          )}
        >
          {isAdmin && <PaddingAdjuster productId={bundle.id} productName={bundle.name} />}
          {bundle.bundleImages && bundle.bundleImages.length > 0 ? (
            <div className="relative w-full h-full" style={innerStyle || undefined}>
              <img
                src={bundle.bundleImages[0]}
                alt={`${bundle.name} item 1`}
                className="absolute top-[8%] left-[2%] h-[60%] w-auto object-contain drop-shadow-md z-10"
                loading="lazy"
              />
              <img
                src={bundle.bundleImages[2]}
                alt={`${bundle.name} item 3`}
                className="absolute top-[8%] right-[2%] h-[60%] w-auto object-contain drop-shadow-md z-10"
                loading="lazy"
              />
              <img
                src={bundle.bundleImages[1]}
                alt={`${bundle.name} item 2`}
                className="absolute bottom-[4%] left-1/2 -translate-x-1/2 h-[65%] w-auto object-contain drop-shadow-lg z-20"
                loading="lazy"
              />
            </div>
          ) : (
            <div style={innerStyle || undefined} className="w-full h-full">
              <img
                src={bundle.image}
                alt={bundle.name}
                className={cn(
                  "w-full h-full transition-transform duration-300 group-hover:scale-105",
                  hasOverride ? "object-contain object-bottom" : "object-cover"
                )}
                loading="lazy"
              />
            </div>
          )}
        </div>
        
        <div className="p-3 md:p-5">
          <h3 className="font-display text-sm md:text-lg text-foreground mb-2 group-hover:text-accent transition-colors line-clamp-2">
            {bundle.name}
          </h3>
          <p className="hidden md:block text-xs text-muted-foreground mb-4 line-clamp-2">
            {bundle.description}
          </p>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <span className="text-sm md:text-lg font-semibold text-foreground whitespace-nowrap">
              From €{bundle.price.toFixed(2)}
            </span>
            <Button 
              variant="outline"
              size="sm"
              className="w-full md:w-auto h-8 md:h-9 px-2 md:px-3 text-[9px] md:text-[10px] font-medium tracking-[0.1em] uppercase rounded-none border-foreground text-foreground hover:bg-foreground hover:text-background"
            >
              Shop now
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export const BundleSection = () => {
  const bundles = getBundles();

  return (
    <section className="py-14 md:py-20 bg-secondary">
      <div className="container">
        <motion.div 
          className="text-center mb-8 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl text-foreground mb-3">
            Check out the fragrance bundles
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto mb-6">
            Save when you bundle these products together
          </p>
          <Link to="/custom-bundle">
            <Button
              size="lg"
              className="rounded-none text-sm md:text-base font-semibold tracking-[0.12em] uppercase bg-accent text-accent-foreground hover:bg-accent/90 px-12 py-7 md:px-16 md:py-8 shadow-lg hover:shadow-xl transition-all"
            >
              ✨ Make Your Own Bundle
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-3">
            Pick any 5 fragrances at special bundle prices
          </p>
          <p className="text-sm text-muted-foreground mt-6 mb-2">
            Or choose from our already made bundles
          </p>
        </motion.div>
        
        <div className="grid grid-cols-2 gap-2 sm:gap-4 md:gap-6 max-w-6xl mx-auto">
          {bundles.map((bundle, index) => (
            <BundleCard key={bundle.id} bundle={bundle} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};
