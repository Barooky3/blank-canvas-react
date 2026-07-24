import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { lazy, Suspense } from 'react';
import { Input } from '@/components/ui/input';
import ProofCarousel from '@/components/home/ProofCarousel';
import HomeTrackOrder from '@/components/home/HomeTrackOrder';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product';
import { getBestsellers, products, getProductById } from '@/data/products';
import { BundleSection, FAQSection } from '@/components/home';
import { useLanguage } from '@/contexts/LanguageContext';
const heroImage = '/images/hero-perfumes.webp';
const logo = '/images/logo.png';

// Lazy-load BrandNavigation since it uses framer-motion eagerly
const BrandNavigation = lazy(() => import('@/components/home/BrandNavigation').then(m => ({ default: m.BrandNavigation })));
const HomeReviews = lazy(() => import('@/components/home/HomeReviews'));
const NextFragrancePoll = lazy(() => import('@/components/home/NextFragrancePoll'));

const Index = () => {
  const allBestsellers = getBestsellers();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const newArrivals = [
    getProductById('lv-city-of-stars'),
    getProductById('invictus-victory-elixir'),
    getProductById('ex-nihilo-blue-talisman'),
  ].filter(Boolean);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = searchQuery.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allBestsellers;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const features = [
    { label: t('hero.instantDelivery') },
    { label: t('hero.verifiedSellers') },
    { label: t('hero.premiumQuality') },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section - CSS animations instead of framer-motion to reduce main-thread blocking */}
      <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-black" style={{ containIntrinsicSize: '0 100vh', contentVisibility: 'visible' }}>
        {/* Background Image with blur */}
        <div className="absolute inset-0 overflow-hidden hero-bg-animate">
          <img
            src={heroImage}
            alt=""
            role="presentation"
            fetchPriority="high"
            width={1920}
            height={1080}
            className="w-full h-full object-cover object-center blur-[2px]"
          />
        </div>
        
        {/* Radial vignette fade - dark edges, lighter center */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 45%, transparent 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.85) 100%)'
          }}
        />
        
        {/* Additional top/bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80" />
        
        <div className="container relative z-10 text-center">
          <div className="max-w-2xl mx-auto hero-content-animate">
            {/* Centered Logo - Main Focus */}
            <div className="relative -mt-4 hero-logo-animate">
              {/* Animated pulsing glow behind logo */}
              <div 
                className="absolute -inset-8 blur-[100px] hero-glow-pulse"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, hsl(345 60% 40% / 0.8), hsl(345 40% 25% / 0.4) 50%, transparent 75%)'
                }}
              />
              {/* Secondary outer glow ring */}
              <div 
                className="absolute -inset-24 blur-[150px] hero-glow-pulse-secondary"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, hsl(345 50% 50% / 0.6), transparent 60%)'
                }}
              />
              <img 
                src={logo} 
                alt="Parfumistry" 
                width={800}
                height={533}
                fetchPriority="high"
                className="h-auto w-[540px] md:w-[700px] lg:w-[920px] mx-auto relative z-10 brightness-0 invert drop-shadow-2xl object-contain blur-[0.4px]"
              />
            </div>
            
            {/* Tagline */}
            <p className="font-display text-xs md:text-sm lg:text-base text-white/70 tracking-[0.2em] uppercase -mt-10 md:-mt-14 lg:-mt-20 mb-6 hero-tagline-animate">
              The Fragrance Library
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 hero-buttons-animate">

              <Button 
                size="lg" 
                className="h-12 px-10 text-[11px] font-medium tracking-[0.15em] uppercase bg-accent text-accent-foreground hover:bg-accent/90 rounded-none active:scale-[0.98] transition-all"
                onClick={() => document.getElementById('bestsellers')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {t('hero.shopNow')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="h-12 px-10 text-[11px] font-medium tracking-[0.15em] uppercase border-white/40 text-white bg-transparent hover:bg-white/10 hover:border-white/60 rounded-none active:scale-[0.98] transition-all"
                asChild
              >
                <Link to="/shop/women">
                  {t('hero.forHer')}
                </Link>
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 mt-8 hero-trust-animate">
              {features.map((feature, index) => (
                <span key={index} className="text-[10px] tracking-[0.15em] text-white/50 font-light uppercase">
                  {feature.label}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hero-scroll-animate">
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </section>

      {/* Brand Navigation */}
      <Suspense fallback={null}>
        <BrandNavigation />
      </Suspense>

      {/* Proof Photo Carousel */}
      <ProofCarousel />

      {/* Track Your Order */}
      <HomeTrackOrder />


      {/* Next Fragrance Poll */}
      <Suspense fallback={null}>
        <NextFragrancePoll />
      </Suspense>

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section className="pt-6 md:pt-10 pb-6 md:pb-10 bg-background">
          <div className="container">
            <p className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-accent text-center mb-2">
              Just In
            </p>
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl text-foreground text-center mb-6 md:mb-8">
              New Arrivals
            </h2>
            <div className="grid grid-cols-3 gap-2 md:gap-4 max-w-[680px] mx-auto">
              {newArrivals.map((product) => (
                <div key={product.id} className="relative bg-secondary/30 border border-border/25 rounded-xl p-3 md:p-4">
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 bg-accent text-accent-foreground text-[8px] font-semibold tracking-[0.15em] uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <Sparkles className="h-2 w-2" />
                    New
                  </div>
                  <ProductCard
                    product={product}
                    imageBgClassName="bg-[#E5DCD5]"
                    hideCategoryBadge
                    imageWrapperClassName="border-[3px] border-border/50 rounded-sm"
                    paddingContext="new-arrivals"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bestsellers Section */}
      <section id="bestsellers" className="pt-4 md:pt-6 pb-14 md:pb-20 bg-background">



        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 md:mb-12">
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl text-foreground">
              {t('home.currentBestSellers')}
            </h2>
            <form onSubmit={handleSearch} className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('shop.searchPlaceholder') || 'Search fragrances...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-none border-border bg-background text-sm"
              />
            </form>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 md:gap-5">
            {filteredProducts.slice(0, 10).map((product) => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
          
          {searchQuery.trim() && filteredProducts.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No fragrances found matching "{searchQuery}"
            </p>
          )}
          
          <div className="text-center mt-10">
            <Button 
              size="lg" 
              className="h-12 px-10 text-[11px] font-medium tracking-[0.12em] uppercase rounded-none bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.98] transition-all"
              asChild
            >
              <Link to="/shop">
                {t('home.viewAllProducts')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Bundle Section */}
      <BundleSection />

      {/* Customer Reviews */}
      <Suspense fallback={null}>
        <HomeReviews />
      </Suspense>

      {/* FAQ Section */}
      <FAQSection />

      {/* Newsletter Section */}
      <section className="py-14 md:py-20 bg-secondary">
        <div className="container">
          <div className="max-w-lg mx-auto text-center">
            <img src={logo} alt="Parfumistry" width={800} height={533} loading="lazy" className="h-14 md:h-16 w-auto mx-auto mb-5 opacity-80" />
            <h2 className="font-display text-xl md:text-2xl lg:text-3xl text-foreground mb-3">
              Join Parfumistry
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {t('home.exclusiveOffers')}
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
              <input
                type="email"
                placeholder={t('home.enterEmail')}
                className="flex-1 h-11 px-4 bg-background text-foreground text-sm border border-border focus:outline-none focus:border-foreground placeholder:text-muted-foreground transition-colors"
              />
              <Button 
                type="submit" 
                className="h-11 px-6 text-[11px] font-medium tracking-[0.1em] uppercase bg-primary hover:bg-primary/90 text-primary-foreground rounded-none active:scale-[0.98] transition-all"
              >
                {t('home.subscribe')}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-4">
              {t('home.noSpam')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
