import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage, LANGUAGES, Language } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  mobile?: boolean;
}

export const LanguageSelector = ({ mobile = false }: LanguageSelectorProps) => {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (open && searchRef.current && !mobile) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [open, mobile]);

  const currentLang = LANGUAGES.find(l => l.code === language);
  const filtered = LANGUAGES.filter(l =>
    l.label.toLowerCase().includes(search.toLowerCase()) ||
    l.code.toLowerCase().includes(search.toLowerCase())
  );

  if (mobile) {
    return (
      <div className="py-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search language..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border text-foreground text-sm px-3 py-2 mb-2 placeholder:text-muted-foreground focus:outline-none focus:border-foreground/50"
          />
          <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        </div>
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {filtered.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLanguage(l.code); setSearch(''); }}
              className={cn(
                'w-full text-left px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2',
                language === l.code
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground px-3 py-2">No language found</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative hidden md:block mr-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-sm text-xs font-medium text-foreground hover:border-foreground/50 transition-colors"
      >
        {currentLang?.flag} {language}
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 bg-background border border-border rounded-sm shadow-lg z-50 min-w-[180px]"
          >
            <div className="p-2 border-b border-border">
              <div className="relative">
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-secondary/50 text-foreground text-xs px-3 py-1.5 pl-7 placeholder:text-muted-foreground focus:outline-none rounded-sm"
                />
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {filtered.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLanguage(l.code); setOpen(false); setSearch(''); }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center gap-2',
                    language === l.code
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{l.code}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-xs text-muted-foreground px-3 py-3 text-center">No language found</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
