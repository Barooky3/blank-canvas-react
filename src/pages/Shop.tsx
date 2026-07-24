import { useState, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ProductCard } from '@/components/product';
import { products } from '@/data/products';
import { useLanguage } from '@/contexts/LanguageContext';

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest';

const brandMap: Record<string, string[]> = {
  versace: ['Versace'], jpg: ['Jean Paul Gaultier', 'JPG'], ysl: ['Yves Saint Laurent', 'YSL'],
  valentino: ['Valentino'], azzaro: ['Azzaro'], armani: ['Giorgio Armani', 'Armani', 'Emporio Armani'],
  lv: ['Louis Vuitton'], pdm: ['Parfums de Marly'], creed: ['Creed'], mancera: ['Mancera'],
  dior: ['Dior', 'Christian Dior'], tomford: ['Tom Ford'], viktor: ['Viktor & Rolf'], xerjoff: ['Xerjoff'],
  paco: ['Paco Rabanne'],
};

const brandDisplayNames: Record<string, string> = {
  versace: 'Versace', jpg: 'Jean Paul Gaultier', ysl: 'Yves Saint Laurent', valentino: 'Valentino',
  azzaro: 'Azzaro', armani: 'Giorgio Armani', lv: 'Louis Vuitton', pdm: 'Parfums de Marly',
  creed: 'Creed', mancera: 'Mancera', dior: 'Dior', tomford: 'Tom Ford', viktor: 'Viktor & Rolf', xerjoff: 'Xerjoff',
  paco: 'Paco Rabanne',
};

const Shop = () => {
  const { category } = useParams<{ category?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const brandFilter = searchParams.get('brand');
  const { t } = useLanguage();
  
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>(category === 'all' || !category ? 'newest' : 'featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getPageTitle = () => {
    if (brandFilter && brandDisplayNames[brandFilter]) return brandDisplayNames[brandFilter];
    if (category === 'men') return t('shop.forHim');
    if (category === 'women') return t('shop.forHer');
    return t('shop.allFragrances');
  };

  const getPageDescription = () => {
    if (brandFilter && brandDisplayNames[brandFilter]) {
      return `${t('shop.discoverAll')} — ${brandDisplayNames[brandFilter]}`;
    }
    if (category === 'men') return t('shop.discoverMen');
    if (category === 'women') return t('shop.discoverWomen');
    return t('shop.discoverAll');
  };

  const clearBrandFilter = () => { searchParams.delete('brand'); setSearchParams(searchParams); };

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    if (brandFilter && brandMap[brandFilter]) {
      const brandNames = brandMap[brandFilter];
      result = result.filter(p => brandNames.some(bn => p.brand.toLowerCase().includes(bn.toLowerCase())));
    }
    if (category === 'men') result = result.filter(p => p.category !== 'women' && p.category !== 'bundle');
    else if (category && category !== 'all') result = result.filter(p => p.category === category);
    if (selectedCategories.length > 0) result = result.filter(p => selectedCategories.includes(p.category));
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    switch (sortBy) {
      case 'price-asc': result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
      case 'newest': {
        // Bundles pinned to the top, then by addedAt desc, then by array index desc.
        const ts = (p: typeof result[number]) => (p.addedAt ? new Date(p.addedAt).getTime() : 0);
        result.sort((a, b) => {
          if (a.isBundle && !b.isBundle) return -1;
          if (!a.isBundle && b.isBundle) return 1;
          const diff = ts(b) - ts(a);
          if (diff !== 0) return diff;
          const aIdx = products.findIndex(p => p.id === a.id);
          const bIdx = products.findIndex(p => p.id === b.id);
          return bIdx - aIdx;
        });
        break;
      }
    }
    return result;
  }, [category, brandFilter, selectedCategories, priceRange, sortBy, searchQuery]);

  const handleCategoryChange = (cat: string, checked: boolean) => {
    if (checked) setSelectedCategories([...selectedCategories, cat]);
    else setSelectedCategories(selectedCategories.filter(c => c !== cat));
  };

  const FilterContent = () => (
    <div className="space-y-8">
      {!category && (
        <div>
          <h3 className="text-xs font-semibold tracking-[0.1em] uppercase text-foreground mb-4">{t('shop.category')}</h3>
          <div className="space-y-3">
            {[
              { value: 'men', label: t('shop.forHim') },
              { value: 'women', label: t('shop.forHer') },
              { value: 'unisex', label: t('shop.unisex') },
            ].map((cat) => (
              <div key={cat.value} className="flex items-center gap-3">
                <Checkbox id={cat.value} checked={selectedCategories.includes(cat.value)} onCheckedChange={(checked) => handleCategoryChange(cat.value, checked as boolean)} />
                <Label htmlFor={cat.value} className="text-sm cursor-pointer text-muted-foreground">{cat.label}</Label>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <h3 className="text-xs font-semibold tracking-[0.1em] uppercase text-foreground mb-4">{t('shop.priceRange')}</h3>
        <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={200} step={5} className="mb-3" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>€{priceRange[0]}</span>
          <span>€{priceRange[1]}</span>
        </div>
      </div>
      <Button variant="outline" size="sm" className="w-full rounded-none border-foreground text-foreground hover:bg-foreground hover:text-background"
        onClick={() => { setSelectedCategories([]); setPriceRange([0, 200]); }}>
        {t('shop.resetFilters')}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 md:py-20 border-b border-border">
        <div className="container text-center">
          <p className="text-xs tracking-[0.3em] text-muted-foreground font-medium mb-4 uppercase">{t('shop.collection')}</p>
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4">{getPageTitle()}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">{getPageDescription()}</p>
          {brandFilter && brandDisplayNames[brandFilter] && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-foreground text-sm">
                {brandDisplayNames[brandFilter]}
                <button onClick={clearBrandFilter} className="hover:text-accent transition-colors" aria-label="Remove brand filter">
                  <X className="h-4 w-4" />
                </button>
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="container">
          {/* Custom Bundle CTA */}
          <div className="mb-8 p-6 md:p-8 border border-border bg-secondary/40 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="text-left">
                <h3 className="font-display text-lg md:text-xl text-foreground mb-1">
                  Make Your Own Bundle
                </h3>
                <p className="text-sm text-muted-foreground">
                  Pick any 5 fragrances at special bundle prices
                </p>
              </div>
              <Link to="/custom-bundle">
                <Button
                  size="lg"
                  className="rounded-none text-sm font-semibold tracking-[0.12em] uppercase bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-6 shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Make Your Own Bundle
                </Button>
              </Link>
            </div>
          </div>

          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder={t('shop.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-none border-border bg-background" />
            </div>
          </div>
          <div className="flex items-center justify-between mb-10 pb-6 border-b border-border">
            <p className="text-sm text-muted-foreground">{filteredProducts.length} {t('shop.products')}</p>
            <div className="flex items-center gap-3">
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden gap-2 rounded-none border-foreground">
                    <SlidersHorizontal className="h-4 w-4" />
                    {t('shop.filters')}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-background border-r border-border">
                  <SheetHeader>
                    <SheetTitle className="text-left text-base font-semibold tracking-[0.1em] uppercase">{t('shop.filters')}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-8"><FilterContent /></div>
                </SheetContent>
              </Sheet>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-44 h-10 text-sm bg-background border-border rounded-none">
                  <SelectValue placeholder={t('shop.sortBy')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">{t('shop.featured')}</SelectItem>
                  <SelectItem value="price-asc">{t('shop.priceLowHigh')}</SelectItem>
                  <SelectItem value="price-desc">{t('shop.priceHighLow')}</SelectItem>
                  <SelectItem value="newest">{t('shop.newest')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-12">
            <aside className="hidden lg:block w-60 flex-shrink-0">
              <div className="sticky top-[120px]">
                <h2 className="text-xs font-semibold tracking-[0.1em] uppercase text-foreground mb-6">{t('shop.filters')}</h2>
                <FilterContent />
              </div>
            </aside>
            <div className="flex-1">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground mb-6">{t('shop.noMatch')}</p>
                  <Button variant="outline" className="rounded-none border-foreground" onClick={() => { setSelectedCategories([]); setPriceRange([0, 200]); }}>
                    {t('shop.clearFilters')}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                  {filteredProducts.map((product, index) => (
                    <div key={product.id} className="animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Shop;
