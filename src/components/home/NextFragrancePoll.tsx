import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import lvCityOfStarsImg from '@/assets/products/lv-city-of-stars.png.asset.json';
import ultraMaleImg from '@/assets/products/jpg-ultra-male.png.asset.json';
import acquaDiGioImg from '@/assets/products/acqua-di-gio-parfum.png.asset.json';

const POLL_ID = 'next-arrival-2026-12-i';
const ADMIN_EMAILS = ['ewhz3384@gmail.com', 'elkhabirmalik@gmail.com'];

const OPTIONS = [
  {
    key: 'jpg-ultra-male',
    label: 'Jean Paul Gaultier Ultra Male',
    image: ultraMaleImg.url,
  },
  {
    key: 'acqua-di-gio-parfum',
    label: 'Giorgio Armani Acqua di Giò Parfum',
    image: acquaDiGioImg.url,
  },
] as const;

const LAST_WINNER = {
  name: 'Louis Vuitton City of Stars',
  image: lvCityOfStarsImg.url,
};

function getFingerprint(): string {
  let fp = localStorage.getItem('poll_fp');
  if (!fp) {
    fp = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem('poll_fp', fp);
  }
  return fp;
}

const NextFragrancePoll = () => {
  const { user } = useAuth();
  const isAdmin = !!user && ADMIN_EMAILS.includes(user.email || '');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [voted, setVoted] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem(`poll_voted_${POLL_ID}`) : null
  );
  const [loading, setLoading] = useState(false);

  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const showResults = !!voted || isAdmin;

  const loadCounts = async () => {
    const { data } = await (supabase as any).rpc('get_poll_counts', { _poll_id: POLL_ID });
    if (Array.isArray(data)) {
      const c: Record<string, number> = {};
      for (const row of data as Array<{ choice: string; vote_count: number }>) {
        c[row.choice] = Number(row.vote_count) || 0;
      }
      setCounts(c);
    }
  };

  useEffect(() => {
    if (showResults) loadCounts();
  }, [showResults]);

  const vote = async (key: string) => {
    if (voted || loading) return;
    setLoading(true);
    const fp = getFingerprint();
    const { error } = await supabase.from('poll_votes').insert({
      poll_id: POLL_ID,
      choice: key,
      voter_fingerprint: fp,
    });
    if (!error) {
      localStorage.setItem(`poll_voted_${POLL_ID}`, key);
      setVoted(key);
      setCounts((c) => ({ ...c, [key]: (c[key] || 0) + 1 }));
    }
    setLoading(false);
  };

  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

  return (
    <section className="pt-6 md:pt-10 pb-2 md:pb-4 bg-background">
      <div className="container max-w-xl">

        <p className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-accent text-center mb-1.5">
          You Decide
        </p>
        <h2 className="font-display text-lg md:text-2xl lg:text-3xl text-foreground text-center mb-1">
          Which should we add next?
        </h2>
        <p className="text-[10px] md:text-xs text-muted-foreground text-center mb-4 md:mb-5">
          {voted ? 'Thanks for voting — here are the live results' : 'Tap your pick to reveal the results'}
        </p>

        <div className="relative flex items-center justify-center gap-2.5 md:gap-4 mb-5 md:mb-8">
          {OPTIONS.map((opt, idx) => {
            const count = counts[opt.key] || 0;
            const percent = pct(count);
            const isPick = voted === opt.key;
            return (
              <div key={opt.key} className="flex-1 max-w-[130px] md:max-w-[180px]">
                <button
                  type="button"
                  onClick={() => vote(opt.key)}
                  disabled={!!voted || loading}
                  className={cn(
                    'group relative w-full aspect-[3/4] rounded-sm overflow-hidden bg-[#EDE8E1] border transition-all',
                    isPick ? 'border-accent ring-2 ring-accent' : 'border-border/40 hover:border-border',
                    !voted && 'cursor-pointer hover:-translate-y-0.5'
                  )}
                >
                  <img
                    src={opt.image}
                    alt={opt.label}
                    loading="lazy"
                    className="w-full h-full object-contain p-1.5 md:p-3 transition-transform duration-500 group-hover:scale-105"
                  />
                  {isPick && (
                    <div className="absolute top-1.5 right-1.5 bg-accent text-accent-foreground rounded-full p-1 shadow">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                  <AnimatePresence>
                    {showResults && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute inset-x-0 bottom-0 bg-background/85 backdrop-blur-sm px-2 py-1.5 text-center"
                      >
                        <div className="text-sm md:text-base font-semibold text-foreground">
                          {percent}%
                        </div>
                        {(isAdmin || total > 200) && (
                          <div className="text-[9px] tracking-wider uppercase text-muted-foreground">
                            {count} vote{count === 1 ? '' : 's'}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                <p className="text-[10px] md:text-xs text-center mt-2 text-foreground font-medium leading-tight line-clamp-2">
                  {opt.label}
                </p>
              </div>
            );
          })}

          {/* OR divider — absolutely centered between the two photos */}
          <div className="absolute left-1/2 top-[calc(50%-10px)] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="font-display text-sm md:text-lg italic text-accent-foreground bg-accent rounded-full h-8 w-8 md:h-10 md:w-10 flex items-center justify-center shadow-md uppercase tracking-wide">
              or
            </div>
          </div>
        </div>

        {/* Last Winner — prominent, integrated champion card */}
        <div className="relative mx-auto max-w-[280px] md:max-w-[320px]">
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-accent text-accent-foreground text-[8px] font-semibold tracking-[0.15em] uppercase px-3 py-1 rounded-full shadow-sm">
            <Trophy className="h-2.5 w-2.5" fill="currentColor" />
            Last Winner
          </div>
          <div className="bg-secondary/40 border-2 border-accent/30 rounded-xl p-4 pt-5 flex items-center gap-3">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-[#EDE8E1] rounded-lg border border-border/30 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
              <img
                src={LAST_WINNER.image}
                alt={LAST_WINNER.name}
                loading="lazy"
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-0.5">
                Previously Voted In
              </p>
              <p className="text-sm md:text-base font-semibold text-foreground leading-tight">
                {LAST_WINNER.name}
              </p>
            </div>
            <div className="ml-auto self-start">
              <div className="bg-accent/10 rounded-full p-1.5">
                <Trophy className="h-4 w-4 md:h-5 md:w-5 text-accent" fill="currentColor" />
              </div>
            </div>
          </div>
        </div>

        {showResults && (isAdmin || total > 200) && (
          <p className="text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-4">
            {isAdmin ? 'Admin · ' : ''}{total} total vote{total === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </section>
  );
};

export default NextFragrancePoll;
