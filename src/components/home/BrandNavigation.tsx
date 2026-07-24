import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const brands = [
  { name: 'Versace', slug: 'versace' },
  { name: 'JPG', slug: 'jpg' },
  { name: 'YSL', slug: 'ysl' },
  { name: 'Valentino', slug: 'valentino' },
  { name: 'Azzaro', slug: 'azzaro' },
  { name: 'Armani', slug: 'armani' },
  { name: 'LouisV', slug: 'lv' },
  { name: 'PDM', slug: 'pdm' },
  { name: 'Creed', slug: 'creed' },
  { name: 'Mancera', slug: 'mancera' },
  { name: 'Xerjoff', slug: 'xerjoff' },
  { name: 'Tom Ford', slug: 'tomford' },
  { name: 'Paco Rabanne', slug: 'paco' },
];

export const BrandNavigation = () => {
  return (
    <motion.section 
      className="py-6 md:py-8 bg-primary border-b border-border"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="container">
        <p className="text-[9px] md:text-[10px] tracking-[0.35em] text-primary-foreground/40 font-medium uppercase text-center mb-4">
          Shop by Brand
        </p>
        <div className="flex items-center justify-center gap-5 md:gap-8 lg:gap-10 flex-wrap">
          {brands.map((brand, i) => (
            <motion.div
              key={brand.slug}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <Link
                to={`/shop?brand=${brand.slug}`}
                className="text-xs md:text-sm tracking-[0.18em] font-semibold text-primary-foreground/80 hover:text-accent uppercase transition-colors duration-200 link-underline"
              >
                {brand.name}
              </Link>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: brands.length * 0.04 }}
          >
            <Link
              to="/shop"
              className="text-xs md:text-sm tracking-[0.18em] font-semibold text-accent hover:text-accent/80 uppercase transition-colors duration-200"
            >
              See all →
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};
