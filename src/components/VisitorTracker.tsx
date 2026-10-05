import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

const SESSION_KEY = 'profparfums-visitor-session';
const HEARTBEAT_INTERVAL = 20000;

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

const ADMIN_EMAILS = ['ewhz3384@gmail.com', 'elkhabirmalik@gmail.com'];
const TRACK_URL = '/api/visitors';

// Only count real visitors on the deployed site — not previews, local dev, or automated browsers.
function isTrackableEnvironment(): boolean {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return false;
  if (/vusercontent\.net|v0\.app|v0\.dev|lovable\.(dev|app)/.test(host)) return false;
  if (navigator.webdriver) return false;
  if (/bot|crawl|spider|headless|lighthouse/i.test(navigator.userAgent)) return false;
  return true;
}

// Captured once per tab so in-site navigations don't overwrite the external referrer.
const initialReferrer = (() => {
  try {
    const ref = document.referrer;
    if (!ref) return null;
    return new URL(ref).hostname === window.location.hostname ? null : ref;
  } catch {
    return null;
  }
})();

export const VisitorTracker = () => {
  const location = useLocation();
  const { items, totalPrice } = useCart();
  const { user } = useAuth();
  const pagesViewedRef = useRef<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
  const trackable = isTrackableEnvironment() && !isAdmin;

  useEffect(() => {
    const path = location.pathname;
    if (!pagesViewedRef.current.includes(path)) {
      pagesViewedRef.current = [...pagesViewedRef.current, path];
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!trackable) return;

    const sendHeartbeat = () => {
      const cartItems = items.map(item => ({
        name: item.product.name,
        brand: item.product.brand,
        quantity: item.quantity,
        price: item.selectedPrice || item.product.price,
        ml: item.selectedMl,
      }));

      fetch(TRACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          sessionId: getSessionId(),
          currentPage: location.pathname,
          cartItems,
          cartTotal: totalPrice,
          deviceType: detectDeviceType(),
          browser: detectBrowser(),
          os: detectOS(),
          screenWidth: window.innerWidth,
          referrer: initialReferrer,
          pagesViewed: pagesViewedRef.current,
          userEmail: user?.email || null,
        }),
      }).catch(() => {});
    };

    const sendLeave = () => {
      const payload = JSON.stringify({ sessionId: getSessionId(), leave: true });
      if (!navigator.sendBeacon?.(TRACK_URL, payload)) {
        fetch(TRACK_URL, { method: 'POST', body: payload, keepalive: true }).catch(() => {});
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') sendHeartbeat();
    };

    sendHeartbeat();
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', sendLeave);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', sendLeave);
    };
  }, [location.pathname, items, totalPrice, user, trackable]);

  return null;
};
