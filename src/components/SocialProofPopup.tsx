import { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { products, bestsellerIds } from '@/data/products';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useProductPadding, computePaddingAndScale } from '@/hooks/useProductPadding';
import type { Product } from '@/types/product';

const ProofProductImage = ({ product }: { product: Product }) => {
  const override = useProductPadding(product.id);
  const { innerStyle, hasOverride } = computePaddingAndScale(override);
  if (product.bundleImages && product.bundleImages.length > 0) {
    return (
      <div className="flex items-end justify-center gap-0.5 h-full p-1">
        {product.bundleImages.map((img, imgIdx) => (
          <img key={imgIdx} src={img} alt="" className="h-[70%] w-auto object-contain" />
        ))}
      </div>
    );
  }
  const legacyPad = ['born-in-roma-intense', 'born-in-roma-green-stravaganza', 'ysl-y-edp'].includes(product.id);
  return (
    <div style={innerStyle || undefined} className="w-full h-full flex items-end justify-center overflow-hidden">
      <img
        src={product.image}
        alt={product.name}
        className={`w-full h-full ${(hasOverride || product.imagePadding || legacyPad) ? 'object-contain object-bottom' : 'object-cover'}`}
      />
    </div>
  );
};

type NameEntry = { display: string; country: string };

const NAMES_BY_COUNTRY: Record<string, { male: string[]; female: string[]; last: string[] }> = {
  'Netherlands': { male: ['Daan', 'Sem', 'Thijs', 'Ruben', 'Bram', 'Stijn', 'Lars', 'Jesse'], female: ['Lieke', 'Fleur', 'Noor', 'Femke', 'Sanne'], last: ['de Vries', 'Jansen', 'Bakker', 'Visser', 'Smit', 'Meijer', 'Mulder', 'Bos', 'Vos', 'Peters'] },
  'Belgium': { male: ['Wout', 'Tibo', 'Senne', 'Matteo', 'Emile', 'Noah', 'Arthur', 'Victor'], female: ['Lore', 'Noor', 'Fien', 'Roos', 'Axelle'], last: ['Peeters', 'Janssens', 'Maes', 'Willems', 'Claes', 'Goossens', 'Wouters', 'De Smedt', 'Hermans', 'Jacobs'] },
  'Germany': { male: ['Lukas', 'Finn', 'Moritz', 'Elias', 'Nico', 'Leon', 'Ben', 'Paul'], female: ['Mia', 'Lena', 'Clara', 'Lea', 'Emilia'], last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Wagner', 'Becker', 'Hoffmann', 'Richter', 'Klein'] },
  'France': { male: ['Hugo', 'Louis', 'Jules', 'Arthur', 'Raphaël', 'Léo', 'Gabriel', 'Adam'], female: ['Léa', 'Manon', 'Camille', 'Chloé', 'Inès'], last: ['Martin', 'Bernard', 'Dubois', 'Laurent', 'Moreau', 'Lefèvre', 'Roux', 'Girard', 'Bonnet', 'Dupont'] },
  'United Kingdom': { male: ['Oliver', 'George', 'Freddie', 'Archie', 'Oscar', 'Jack', 'Harry', 'Noah'], female: ['Amelia', 'Isla', 'Florence', 'Ivy', 'Rosie'], last: ['Smith', 'Taylor', 'Brown', 'Wilson', 'Davies', 'Evans', 'Thomas', 'Roberts', 'Walker', 'Clarke'] },
  'Spain': { male: ['Mateo', 'Hugo', 'Pablo', 'Daniel', 'Álvaro', 'Lucas', 'Adrián', 'Leo'], female: ['Lucía', 'Martina', 'Sofía', 'Valeria', 'Claudia'], last: ['García', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Ruiz', 'Hernández', 'Díaz'] },
  'Italy': { male: ['Leonardo', 'Francesco', 'Alessandro', 'Lorenzo', 'Matteo', 'Tommaso', 'Riccardo', 'Andrea'], female: ['Sofia', 'Aurora', 'Giulia', 'Alice', 'Ginevra'], last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco'] },
  'Poland': { male: ['Antoni', 'Jakub', 'Szymon', 'Filip', 'Mikołaj', 'Kacper', 'Wojciech', 'Adam'], female: ['Zuzanna', 'Hanna', 'Maja', 'Lena', 'Alicja'], last: ['Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański', 'Woźniak', 'Dąbrowski'] },
  'Sweden': { male: ['Liam', 'Elias', 'William', 'Hugo', 'Oscar', 'Noah', 'Adam', 'Lucas'], female: ['Astrid', 'Maja', 'Ella', 'Ebba', 'Wilma'], last: ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 'Svensson', 'Gustafsson'] },
  'United States': { male: ['Ethan', 'Mason', 'Caleb', 'Noah', 'Logan', 'James', 'Liam', 'Jackson'], female: ['Sophia', 'Olivia', 'Ava', 'Mia', 'Harper'], last: ['Johnson', 'Williams', 'Davis', 'Miller', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin'] },
  'Canada': { male: ['Liam', 'Noah', 'Ethan', 'Jack', 'Lucas', 'Owen', 'James', 'Ben'], female: ['Emma', 'Olivia', 'Charlotte', 'Amelia', 'Sophia'], last: ['Smith', 'Brown', 'Tremblay', 'Martin', 'Roy', 'Wilson', 'Gagnon', 'Taylor', 'Campbell', 'Anderson'] },
  'Portugal': { male: ['Santiago', 'Tomás', 'Martim', 'Rodrigo', 'Afonso', 'Guilherme', 'Duarte', 'Miguel'], female: ['Leonor', 'Matilde', 'Beatriz', 'Carolina', 'Mariana'], last: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Sousa', 'Fernandes'] },
  'Austria': { male: ['Felix', 'Paul', 'David', 'Jonas', 'Maximilian', 'Lukas', 'Jakob', 'Elias'], female: ['Anna', 'Laura', 'Sarah', 'Sophie', 'Marie'], last: ['Gruber', 'Huber', 'Bauer', 'Wagner', 'Steiner', 'Pichler', 'Moser', 'Berger', 'Mayer', 'Hofer'] },
  'Denmark': { male: ['Noah', 'Oscar', 'William', 'Lucas', 'Emil', 'Victor', 'Magnus', 'Oliver'], female: ['Alma', 'Ida', 'Freja', 'Clara', 'Ella'], last: ['Nielsen', 'Jensen', 'Hansen', 'Andersen', 'Pedersen', 'Christensen', 'Larsen', 'Sørensen', 'Rasmussen', 'Madsen'] },
  'Norway': { male: ['Jakob', 'Filip', 'Aksel', 'Henrik', 'Theodor', 'Emil', 'Oliver', 'Magnus'], female: ['Nora', 'Emma', 'Olivia', 'Ella', 'Ingrid'], last: ['Hansen', 'Johansen', 'Olsen', 'Larsen', 'Andersen', 'Pedersen', 'Nilsen', 'Kristiansen', 'Karlsen', 'Eriksen'] },
  'Switzerland': { male: ['Liam', 'Noah', 'Leon', 'Luca', 'Julian', 'David', 'Samuel', 'Elias'], female: ['Mia', 'Elena', 'Lara', 'Emilia', 'Sara'], last: ['Müller', 'Meier', 'Schmid', 'Keller', 'Weber', 'Huber', 'Schneider', 'Meyer', 'Steiner', 'Fischer'] },
  'Greece': { male: ['Georgios', 'Dimitris', 'Nikos', 'Alexandros', 'Kostas', 'Andreas', 'Ioannis', 'Michalis'], female: ['Maria', 'Eleni', 'Sofia', 'Anna', 'Katerina'], last: ['Papadopoulos', 'Vlahos', 'Nikolaou', 'Georgiou', 'Pappas', 'Koutsikos', 'Ioannou', 'Dimitriou', 'Antoniou', 'Karagiannis'] },
  'Czech Republic': { male: ['Jakub', 'Tomáš', 'Adam', 'Filip', 'Ondřej', 'Matěj', 'David', 'Vojtěch'], female: ['Eliška', 'Tereza', 'Anna', 'Natálie', 'Karolína'], last: ['Novák', 'Svoboda', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horák', 'Němec', 'Pokorný'] },
  'Ireland': { male: ['Conor', 'Sean', 'Cian', 'Oisín', 'Fionn', 'Liam', 'Jack', 'James'], female: ['Aoife', 'Saoirse', 'Ciara', 'Niamh', 'Róisín'], last: ['Murphy', 'Kelly', 'O\'Sullivan', 'Walsh', 'O\'Brien', 'Byrne', 'Ryan', 'O\'Connor', 'Doyle', 'McCarthy'] },
  'Croatia': { male: ['Luka', 'Marko', 'Ivan', 'Matej', 'Filip', 'Antonio', 'David', 'Leon'], female: ['Ana', 'Petra', 'Mia', 'Lucija', 'Sara'], last: ['Horvat', 'Kovačević', 'Babić', 'Marić', 'Novak', 'Jurić', 'Knežević', 'Vuković', 'Matić', 'Tomić'] },
  'Romania': { male: ['Andrei', 'Alexandru', 'David', 'Stefan', 'Gabriel', 'Mihai', 'Radu', 'Cristian'], female: ['Maria', 'Elena', 'Ioana', 'Ana', 'Daria'], last: ['Popa', 'Ionescu', 'Popescu', 'Stan', 'Dumitru', 'Stoica', 'Gheorghe', 'Rusu', 'Moldovan', 'Munteanu'] },
  'Bulgaria': { male: ['Georgi', 'Ivan', 'Dimitar', 'Nikola', 'Alexander', 'Martin', 'Boris', 'Stefan'], female: ['Maria', 'Elena', 'Viktoria', 'Gabriela', 'Sophia'], last: ['Ivanov', 'Georgiev', 'Dimitrov', 'Petrov', 'Nikolov', 'Hristov', 'Todorov', 'Stoyanov', 'Angelov', 'Kolev'] },
};

const PAYMENT_METHODS = [
  { id: 'paypal', label: 'PayPal', icon: null, iconUrl: null, weight: 1.15, inlineSvg: true, bgColor: '#0070BA', textColor: '#fff' },
  { id: 'rewarble', label: 'Rewarble', icon: null, iconUrl: '/images/rewarble-icon.svg', weight: 1.50 },
];

const ALL_COUNTRIES = Object.keys(NAMES_BY_COUNTRY);
const inStockProducts = products.filter(p => p.inStock);

function pickRandomProduct(): typeof products[0] | null {
  if (inStockProducts.length === 0) return null;
  const rand = Math.random();
  if (rand < 0.50) {
    const bundles = inStockProducts.filter(p => p.isBundle);
    if (bundles.length > 0) return bundles[Math.floor(Math.random() * bundles.length)];
  }
  if (rand < 0.40) {
    const bestsellers = inStockProducts.filter(p => bestsellerIds.includes(p.id) && !p.isBundle);
    if (bestsellers.length > 0) return bestsellers[Math.floor(Math.random() * bestsellers.length)];
  }
  return inStockProducts[Math.floor(Math.random() * inStockProducts.length)];
}

function pickRandomPaymentMethod(): typeof PAYMENT_METHODS[0] {
  const totalWeight = PAYMENT_METHODS.reduce((sum, m) => sum + m.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const method of PAYMENT_METHODS) {
    rand -= method.weight;
    if (rand <= 0) return method;
  }
  return PAYMENT_METHODS[0];
}

function randomMinutesAgo(): string {
  const rand = Math.random();
  let mins: number;
  if (rand < 0.6) {
    // 60% chance: 20-30 mins
    mins = Math.floor(Math.random() * 11) + 20;
  } else if (rand < 0.85) {
    // 25% chance: 10-19 mins
    mins = Math.floor(Math.random() * 10) + 10;
  } else {
    // 15% chance: 1-9 mins
    mins = Math.floor(Math.random() * 9) + 1;
  }
  return `${mins} min${mins > 1 ? 's' : ''} ago`;
}

function randomInterval(): number {
  return (Math.floor(Math.random() * 21) + 28) * 1000; // 28-49 seconds
}

export const SocialProofPopup = () => {
  const [visible, setVisible] = useState(false);
  const [notification, setNotification] = useState<{
    product: typeof products[0];
    customerName: string;
    country: string;
    timeAgo: string;
    paymentMethod: typeof PAYMENT_METHODS[0];
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const poolRef = useRef<NameEntry[]>([]);
  const queueRef = useRef<NameEntry[]>([]);
  const countryIndexRef = useRef(0);
  const shuffledCountriesRef = useRef<string[]>([]);

  // Fallback synthetic entries built from the static lists
  const buildFallbackPool = (): NameEntry[] => {
    const out: NameEntry[] = [];
    for (const country of ALL_COUNTRIES) {
      const n = NAMES_BY_COUNTRY[country];
      const firsts = [...n.male, ...n.female];
      for (const f of firsts) {
        for (const l of n.last) {
          out.push({ display: `${f} ${l.charAt(0)}.`, country });
        }
      }
    }
    return out;
  };

  const reshuffleQueue = useCallback(() => {
    const arr = [...poolRef.current];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    queueRef.current = arr;
  }, []);

  useEffect(() => {
    const arr = [...ALL_COUNTRIES];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    shuffledCountriesRef.current = arr;

    // Seed with fallback so popups can start immediately
    poolRef.current = buildFallbackPool();
    reshuffleQueue();

    // Then fetch real customer names from the database
    (async () => {
      try {
        const { data } = await supabase.functions.invoke('social-proof-names');
        const entries: NameEntry[] = (data?.entries || []).filter(
          (e: any) => e && typeof e.display === 'string' && typeof e.country === 'string'
        );
        if (entries.length > 0) {
          poolRef.current = entries;
          reshuffleQueue();
        }
      } catch {
        // keep fallback
      }
    })();
  }, [reshuffleQueue]);

  const scheduleNext = useCallback((fn: () => void) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(fn, randomInterval());
  }, []);

  const showNotification = useCallback(() => {
    if (queueRef.current.length === 0) reshuffleQueue();
    const entry = queueRef.current.shift();
    if (!entry) { scheduleNext(showNotification); return; }

    const product = pickRandomProduct();
    if (!product) { scheduleNext(showNotification); return; }
    const timeAgo = randomMinutesAgo();
    const paymentMethod = pickRandomPaymentMethod();
    setNotification({ product, customerName: entry.display, country: entry.country, timeAgo, paymentMethod });
    setVisible(true);
    setTimeout(() => {
      setVisible(false);
      scheduleNext(showNotification);
    }, 9000);
  }, [scheduleNext]);

  useEffect(() => {
    const initialTimeout = setTimeout(showNotification, 12000);
    return () => {
      clearTimeout(initialTimeout);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [showNotification]);

  if (!notification) return null;

  const pm = notification.paymentMethod;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-5 left-5 z-50 w-[370px] rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(30 25% 98% / 0.97), hsl(30 20% 96% / 0.95))',
            boxShadow: '0 12px 40px -8px rgba(0,0,0,0.12), 0 4px 16px -4px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
            border: '1px solid hsl(30 15% 88%)',
          }}
        >
          {/* Top accent line */}
          <div className="h-[2.5px] w-full bg-gradient-to-r from-transparent via-accent to-transparent" />

          <div className="flex items-center gap-4 p-5">
            {/* Product image */}
            <div className="w-[72px] h-[82px] rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-border/50"
              style={{ background: 'hsl(30 20% 94%)' }}
            >
              <ProofProductImage product={notification.product} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] text-muted-foreground leading-snug">
                <span className="font-semibold text-foreground">{notification.customerName}</span>
                {' '}from <span className="text-foreground font-medium">{notification.country}</span>
              </p>
              <p className="text-[13.5px] font-semibold text-foreground mt-1 truncate">
                ordered {notification.product.name}
              </p>

              {/* Payment method + time */}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
                  style={{
                    background: pm.bgColor || 'hsl(30 15% 92%)',
                    color: pm.textColor || undefined,
                  }}
                >
                  {pm.id === 'paypal' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.645h6.527c2.168 0 3.87.458 5.048 1.36 1.236.945 1.86 2.378 1.86 4.26 0 .376-.04.758-.117 1.15-.727 3.655-3.25 5.507-7.516 5.507H9.522a.77.77 0 0 0-.757.645l-1.69 5.34z" fill="white"/>
                      <path d="M20.16 8.848c-.727 3.655-3.25 5.507-7.516 5.507H10.66a.77.77 0 0 0-.757.645l-1.15 3.63-.486 3.085a.641.641 0 0 0 .633.74h3.34a.77.77 0 0 0 .757-.645l.632-3.18a.77.77 0 0 1 .757-.645h1.594c4.267 0 6.79-1.852 7.516-5.507.41-2.06-.076-3.655-1.337-4.63z" fill="rgba(255,255,255,0.7)"/>
                    </svg>
                  )}
                  {pm.icon ? (
                    <span className="text-sm">{pm.icon}</span>
                  ) : pm.iconUrl ? (
                    <img src={pm.iconUrl} alt={pm.label} className="w-5 h-5 object-contain" />
                  ) : null}
                  <span className="text-[11.5px] font-semibold" style={{ color: pm.textColor || undefined }}>{pm.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-[11px] text-muted-foreground">{notification.timeAgo}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setVisible(false)}
              className="text-muted-foreground/40 hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/60 self-start -mt-1.5 -mr-1.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
