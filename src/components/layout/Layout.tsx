import { ReactNode, lazy, Suspense, useEffect, useState, type ComponentType } from 'react';
import { PromoBanner } from './PromoBanner';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from './CartDrawer';

const isDynamicImportError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(message);
};

const lazyWithReload = <T extends ComponentType<unknown>>(loader: () => Promise<{ default: T }>) =>
  lazy(() =>
    loader().catch((error) => {
      if (typeof window !== 'undefined' && isDynamicImportError(error)) {
        const key = '__widget_chunk_reload__';
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          window.location.reload();
          return new Promise<{ default: T }>(() => undefined);
        }
      }
      throw error;
    })
  );

// Lazy-load non-critical widgets to reduce initial main-thread work
const SocialProofPopup = lazyWithReload(() => import('@/components/SocialProofPopup').then(m => ({ default: m.SocialProofPopup })));
const VisitorTracker = lazyWithReload(() => import('@/components/VisitorTracker').then(m => ({ default: m.VisitorTracker })));
const RejectionNotificationPopup = lazyWithReload(() => import('@/components/RejectionNotificationPopup').then(m => ({ default: m.RejectionNotificationPopup })));
const BannedUserPopup = lazyWithReload(() => import('@/components/BannedUserPopup').then(m => ({ default: m.BannedUserPopup })));


interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [showDeferred, setShowDeferred] = useState(false);

  useEffect(() => {
    // Defer non-critical widgets until after initial render + idle time
    // requestIdleCallback is not supported in Safari/iOS — fallback to setTimeout
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(() => setShowDeferred(true), { timeout: 2000 });
      return () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(() => setShowDeferred(true), 1000);
      return () => clearTimeout(id);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PromoBanner />
      <Header />
      <main className="flex-1" style={{ paddingTop: 'calc(var(--promo-banner-height, 0px) + 64px)' }}>
        {children}
      </main>
      <Footer />
      <CartDrawer />
      {showDeferred && (
        <Suspense fallback={null}>
          <SocialProofPopup />
          <VisitorTracker />
          <RejectionNotificationPopup />
          <BannedUserPopup />
        </Suspense>
      )}
    </div>
  );
};
