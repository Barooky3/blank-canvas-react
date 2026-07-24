import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

const SESSION_KEY = 'profparfums-visitor-session';
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Other';
}

function detectOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Other';
}

function detectDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function getLocationFromTimezone(): { country: string; city: string } {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzMap: Record<string, { country: string; city: string }> = {
      // Europe
      'Europe/Sofia': { country: 'Bulgaria', city: 'Sofia' },
      'Europe/Berlin': { country: 'Germany', city: 'Berlin' },
      'Europe/Paris': { country: 'France', city: 'Paris' },
      'Europe/London': { country: 'United Kingdom', city: 'London' },
      'Europe/Amsterdam': { country: 'Netherlands', city: 'Amsterdam' },
      'Europe/Brussels': { country: 'Belgium', city: 'Brussels' },
      'Europe/Madrid': { country: 'Spain', city: 'Madrid' },
      'Europe/Rome': { country: 'Italy', city: 'Rome' },
      'Europe/Milan': { country: 'Italy', city: 'Milan' },
      'Europe/Vienna': { country: 'Austria', city: 'Vienna' },
      'Europe/Warsaw': { country: 'Poland', city: 'Warsaw' },
      'Europe/Prague': { country: 'Czech Republic', city: 'Prague' },
      'Europe/Budapest': { country: 'Hungary', city: 'Budapest' },
      'Europe/Bucharest': { country: 'Romania', city: 'Bucharest' },
      'Europe/Athens': { country: 'Greece', city: 'Athens' },
      'Europe/Helsinki': { country: 'Finland', city: 'Helsinki' },
      'Europe/Stockholm': { country: 'Sweden', city: 'Stockholm' },
      'Europe/Oslo': { country: 'Norway', city: 'Oslo' },
      'Europe/Copenhagen': { country: 'Denmark', city: 'Copenhagen' },
      'Europe/Dublin': { country: 'Ireland', city: 'Dublin' },
      'Europe/Lisbon': { country: 'Portugal', city: 'Lisbon' },
      'Europe/Zurich': { country: 'Switzerland', city: 'Zurich' },
      'Europe/Luxembourg': { country: 'Luxembourg', city: 'Luxembourg' },
      'Europe/Monaco': { country: 'Monaco', city: 'Monaco' },
      'Europe/Zagreb': { country: 'Croatia', city: 'Zagreb' },
      'Europe/Ljubljana': { country: 'Slovenia', city: 'Ljubljana' },
      'Europe/Bratislava': { country: 'Slovakia', city: 'Bratislava' },
      'Europe/Tallinn': { country: 'Estonia', city: 'Tallinn' },
      'Europe/Riga': { country: 'Latvia', city: 'Riga' },
      'Europe/Vilnius': { country: 'Lithuania', city: 'Vilnius' },
      'Europe/Belgrade': { country: 'Serbia', city: 'Belgrade' },
      'Europe/Sarajevo': { country: 'Bosnia', city: 'Sarajevo' },
      'Europe/Skopje': { country: 'North Macedonia', city: 'Skopje' },
      'Europe/Podgorica': { country: 'Montenegro', city: 'Podgorica' },
      'Europe/Tirana': { country: 'Albania', city: 'Tirana' },
      'Europe/Chisinau': { country: 'Moldova', city: 'Chisinau' },
      'Europe/Kiev': { country: 'Ukraine', city: 'Kyiv' },
      'Europe/Kyiv': { country: 'Ukraine', city: 'Kyiv' },
      'Europe/Minsk': { country: 'Belarus', city: 'Minsk' },
      'Europe/Moscow': { country: 'Russia', city: 'Moscow' },
      'Europe/Malta': { country: 'Malta', city: 'Valletta' },
      'Europe/Nicosia': { country: 'Cyprus', city: 'Nicosia' },
      'Europe/Andorra': { country: 'Andorra', city: 'Andorra la Vella' },
      'Europe/Tirane': { country: 'Albania', city: 'Tirana' },
      'Europe/Istanbul': { country: 'Turkey', city: 'Istanbul' },
      'Europe/Mariehamn': { country: 'Finland', city: 'Mariehamn' },
      'Europe/Gibraltar': { country: 'Gibraltar', city: 'Gibraltar' },
      'Europe/San_Marino': { country: 'San Marino', city: 'San Marino' },
      'Europe/Vatican': { country: 'Vatican City', city: 'Vatican' },
      // Americas
      'America/New_York': { country: 'United States', city: 'New York' },
      'America/Chicago': { country: 'United States', city: 'Chicago' },
      'America/Denver': { country: 'United States', city: 'Denver' },
      'America/Los_Angeles': { country: 'United States', city: 'Los Angeles' },
      'America/Phoenix': { country: 'United States', city: 'Phoenix' },
      'America/Anchorage': { country: 'United States', city: 'Anchorage' },
      'America/Toronto': { country: 'Canada', city: 'Toronto' },
      'America/Vancouver': { country: 'Canada', city: 'Vancouver' },
      'America/Montreal': { country: 'Canada', city: 'Montreal' },
      'America/Sao_Paulo': { country: 'Brazil', city: 'São Paulo' },
      'America/Argentina/Buenos_Aires': { country: 'Argentina', city: 'Buenos Aires' },
      'America/Mexico_City': { country: 'Mexico', city: 'Mexico City' },
      'America/Bogota': { country: 'Colombia', city: 'Bogotá' },
      'America/Lima': { country: 'Peru', city: 'Lima' },
      'America/Santiago': { country: 'Chile', city: 'Santiago' },
      // Asia & Middle East
      'Asia/Tokyo': { country: 'Japan', city: 'Tokyo' },
      'Asia/Shanghai': { country: 'China', city: 'Shanghai' },
      'Asia/Seoul': { country: 'South Korea', city: 'Seoul' },
      'Asia/Dubai': { country: 'UAE', city: 'Dubai' },
      'Asia/Riyadh': { country: 'Saudi Arabia', city: 'Riyadh' },
      'Asia/Istanbul': { country: 'Turkey', city: 'Istanbul' },
      'Asia/Kolkata': { country: 'India', city: 'Mumbai' },
      'Asia/Calcutta': { country: 'India', city: 'Kolkata' },
      'Asia/Singapore': { country: 'Singapore', city: 'Singapore' },
      'Asia/Hong_Kong': { country: 'Hong Kong', city: 'Hong Kong' },
      'Asia/Bangkok': { country: 'Thailand', city: 'Bangkok' },
      'Asia/Kuala_Lumpur': { country: 'Malaysia', city: 'Kuala Lumpur' },
      'Asia/Jakarta': { country: 'Indonesia', city: 'Jakarta' },
      'Asia/Manila': { country: 'Philippines', city: 'Manila' },
      'Asia/Taipei': { country: 'Taiwan', city: 'Taipei' },
      'Asia/Beirut': { country: 'Lebanon', city: 'Beirut' },
      'Asia/Jerusalem': { country: 'Israel', city: 'Jerusalem' },
      'Asia/Tel_Aviv': { country: 'Israel', city: 'Tel Aviv' },
      'Asia/Kuwait': { country: 'Kuwait', city: 'Kuwait City' },
      'Asia/Qatar': { country: 'Qatar', city: 'Doha' },
      'Asia/Bahrain': { country: 'Bahrain', city: 'Manama' },
      'Asia/Muscat': { country: 'Oman', city: 'Muscat' },
      // Africa
      'Africa/Cairo': { country: 'Egypt', city: 'Cairo' },
      'Africa/Johannesburg': { country: 'South Africa', city: 'Johannesburg' },
      'Africa/Lagos': { country: 'Nigeria', city: 'Lagos' },
      'Africa/Nairobi': { country: 'Kenya', city: 'Nairobi' },
      'Africa/Harare': { country: 'Zimbabwe', city: 'Harare' },
      'Africa/Casablanca': { country: 'Morocco', city: 'Casablanca' },
      'Africa/Tunis': { country: 'Tunisia', city: 'Tunis' },
      'Africa/Algiers': { country: 'Algeria', city: 'Algiers' },
      // Oceania
      'Australia/Sydney': { country: 'Australia', city: 'Sydney' },
      'Australia/Melbourne': { country: 'Australia', city: 'Melbourne' },
      'Australia/Perth': { country: 'Australia', city: 'Perth' },
      'Pacific/Auckland': { country: 'New Zealand', city: 'Auckland' },
    };
    if (tzMap[tz]) return tzMap[tz];
    // Fallback: extract city name from timezone
    const parts = tz.split('/');
    const cityName = (parts[parts.length - 1] || '').replace(/_/g, ' ');
    const region = parts[0];
    const regionMap: Record<string, string> = {
      'Europe': 'Europe', 'America': 'Americas', 'Asia': 'Asia',
      'Africa': 'Africa', 'Australia': 'Australia', 'Pacific': 'Oceania',
    };
    return { country: regionMap[region] || region, city: cityName || 'Unknown' };
  } catch {
    return { country: 'Unknown', city: 'Unknown' };
  }
}

// Skip tracking entirely on lovable.dev preview domains
const ADMIN_EMAILS = ['ewhz3384@gmail.com'];

export const VisitorTracker = () => {
  const location = useLocation();
  const { items, totalPrice } = useCart();
  const { user } = useAuth();
  const pagesViewedRef = useRef<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Don't track if on lovable.dev or if user is an admin
  const isLovableDev = window.location.hostname.includes('lovable.dev') || window.location.hostname.includes('lovable.app/id-preview');
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    // Track pages viewed
    const path = location.pathname;
    if (!pagesViewedRef.current.includes(path)) {
      pagesViewedRef.current = [...pagesViewedRef.current, path];
    }
  }, [location.pathname]);

  useEffect(() => {
    // Don't track admins or lovable.dev previews
    if (isLovableDev || isAdmin) return;

    const sendHeartbeat = async () => {
      try {
        const cartItems = items.map(item => ({
          name: item.product.name,
          brand: item.product.brand,
          quantity: item.quantity,
          price: item.selectedPrice || item.product.price,
          ml: item.selectedMl,
        }));

        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-visitor`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: getSessionId(),
              currentPage: location.pathname,
              cartItems,
              cartTotal: totalPrice,
              isInCheckout: location.pathname === '/checkout',
              ...getLocationFromTimezone(),
              deviceType: detectDeviceType(),
              browser: detectBrowser(),
              os: detectOS(),
              screenWidth: window.innerWidth,
              referrer: document.referrer || null,
              pagesViewed: pagesViewedRef.current,
              userEmail: user?.email || null,
            }),
          }
        );
      } catch {
        // Silent fail - don't disrupt user experience
      }
    };

    sendHeartbeat();
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [location.pathname, items, totalPrice, user, isLovableDev, isAdmin]);

  return null; // Invisible component
};
