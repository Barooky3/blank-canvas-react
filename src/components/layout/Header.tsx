import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, User, ChevronDown, LogOut, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useCurrency, CURRENCIES, Currency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Nav links use translation keys
const navLinkKeys = [
  { href: '/shop/men', key: 'nav.men' },
  { href: '/shop/women', key: 'nav.women' },
  { href: '/shop', key: 'nav.shopAll' },
  { href: '/contact', key: 'nav.contact' },
];

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { toggleCart, totalItems } = useCart();
  const { currency, setCurrency } = useCurrency();
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Close currency dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setCurrencyOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <header 
      className="fixed left-0 right-0 z-40 bg-background/40 backdrop-blur-md border-b border-border/30"
      style={{
        top: 'var(--promo-banner-height, 0px)',
        transition: 'top 0.3s ease-out',
        marginBottom: '8px'
      }}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <span className="text-base sm:text-[1.35rem] md:text-xl font-semibold tracking-[0.15em] text-foreground uppercase">
              Parfinity
            </span>
          </Link>

          {/* Desktop Navigation + FAQ */}
          <nav className="hidden md:flex items-center gap-6 ml-8 mr-auto">
            <Link
              to="/faq"
              className={cn(
                'relative flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold tracking-[0.12em] uppercase transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95',
                'bg-accent text-accent-foreground ring-2 ring-accent/40 ring-offset-2 ring-offset-background',
                location.pathname === '/faq' && 'ring-accent'
              )}
            >
              <HelpCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
              FAQ
            </Link>
            {navLinkKeys.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'text-xs font-medium tracking-[0.15em] transition-colors hover:text-accent',
                  location.pathname === link.href
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>

          {/* Mobile FAQ — prominent centered pill with glow */}
          <div className="md:hidden flex-1 flex items-center justify-center px-1 sm:px-2 min-w-0">
            <Link
              to="/faq"
              className={cn(
                'flex items-center gap-1 sm:gap-1.5 px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold tracking-[0.14em] uppercase shadow-lg shadow-accent/25 ring-2 ring-accent/60 ring-offset-2 ring-offset-background transition-all active:scale-95 shrink-0 animate-pulse',
                'bg-accent text-accent-foreground'
              )}
              aria-label="FAQ"
            >
              <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
              <span>FAQ</span>
            </Link>
          </div>




          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-3 md:pl-6 shrink-0">
            {/* Currency Dropdown - compact on mobile */}
            <div ref={currencyRef} className="relative md:mr-1">
              <button
                onClick={() => setCurrencyOpen(!currencyOpen)}
                className="flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1.5 border border-border rounded-sm text-[10px] md:text-xs font-medium text-foreground hover:border-foreground/50 transition-colors"
              >
                {currency}
                <ChevronDown className={cn('h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground transition-transform', currencyOpen && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {currencyOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1 bg-background border border-border rounded-sm shadow-lg z-50 max-h-64 overflow-y-auto min-w-[100px]"
                  >
                    {CURRENCIES.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => { setCurrency(c.code); setCurrencyOpen(false); }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center gap-2',
                          currency === c.code
                            ? 'bg-secondary text-foreground'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        )}
                      >
                        <span>{c.symbol}</span>
                        <span>{c.code}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Language Dropdown — desktop only (mobile uses in-menu selector) */}
            <div className="hidden md:block">
              <LanguageSelector />
            </div>

            {/* Account */}
            {user ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-accent hover:text-accent hover:bg-transparent"
                asChild
              >
                <Link to="/account" aria-label="My Account">
                  <User className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={1.5} />
                </Link>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-foreground hover:text-accent hover:bg-transparent"
                asChild
              >
                <Link to="/login" aria-label="Account">
                  <User className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={1.5} />
                </Link>
              </Button>
            )}

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-foreground hover:text-accent hover:bg-transparent"
              onClick={toggleCart}
              aria-label="Open cart"
            >
              <ShoppingBag className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-accent text-accent-foreground text-[9px] sm:text-[10px] flex items-center justify-center font-semibold">
                  {totalItems}
                </span>
              )}
            </Button>

            {/* Mobile Menu */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 sm:h-9 sm:w-9 text-foreground hover:text-accent hover:bg-transparent"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={1.5} />
              ) : (
                <Menu className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={1.5} />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="md:hidden absolute left-0 right-0 top-full bg-background border-b border-border overflow-hidden z-40"
          >
            <nav className="container py-6 flex flex-col gap-1">
              {navLinkKeys.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <Link
                    to={link.href}
                    className={cn(
                      'text-sm font-medium tracking-[0.1em] py-3 transition-colors border-b border-border block',
                      location.pathname === link.href
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t(link.key)}
                  </Link>
                </motion.div>
              ))}
              {/* Mobile FAQ Link */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navLinkKeys.length * 0.05, duration: 0.3 }}
              >
                <Link
                  to="/faq"
                  className={cn(
                    'text-sm font-medium tracking-[0.1em] py-3 transition-colors border-b border-border block',
                    location.pathname === '/faq'
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  FAQ
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (navLinkKeys.length + 1) * 0.05, duration: 0.3 }}
              >
                {user ? (
                  <Link
                    to="/account"
                    className="text-sm font-medium tracking-[0.1em] py-3 text-muted-foreground hover:text-foreground block"
                  >
                    {t('nav.myAccount')}
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="text-sm font-medium tracking-[0.1em] py-3 text-muted-foreground hover:text-foreground block"
                  >
                    {t('nav.account')}
                  </Link>
                )}
              </motion.div>
              {/* Mobile Language Selector */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (navLinkKeys.length + 2) * 0.05, duration: 0.3 }}
              >
                <LanguageSelector mobile />
              </motion.div>
              {/* Mobile Currency Selector */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (navLinkKeys.length + 3) * 0.05, duration: 0.3 }}
              >
                <div className="py-3">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="bg-background border border-border text-foreground text-sm font-medium px-3 py-2 pr-8 appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.symbol} {c.code}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
