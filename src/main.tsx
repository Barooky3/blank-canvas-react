import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./utils/firstVisit";


// Polyfill requestIdleCallback for Safari/iOS which doesn't support it
// Prevents white-screen crashes on Apple devices
if (typeof window !== 'undefined' && !window.requestIdleCallback) {
  (window as any).requestIdleCallback = (cb: IdleRequestCallback, opts?: IdleRequestOptions) => {
    const start = Date.now();
    return window.setTimeout(() => {
      cb({ didTimeout: false, timeRemaining: () => Math.max(0, 50 - (Date.now() - start)) } as IdleDeadline);
    }, opts?.timeout ? Math.min(opts.timeout, 1000) : 1);
  };
  (window as any).cancelIdleCallback = (id: number) => window.clearTimeout(id);
}

// Silence the benign "ResizeObserver loop completed with undelivered notifications"
// warning. It's harmless (fired when a ResizeObserver callback causes a layout
// change in the same frame — common with charts/Radix/carousels) but the dev
// overlay surfaces it as an error. We only swallow this exact message.
if (typeof window !== 'undefined') {
  const isResizeObserverLoop = (msg?: string) =>
    !!msg && /ResizeObserver loop (limit exceeded|completed with undelivered notifications)/i.test(msg);

  window.addEventListener('error', (e) => {
    if (isResizeObserverLoop(e?.message)) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  });
}

// Auto-recover from stale lazy-loaded chunks after a redeploy.
// When Vite ships new hashed chunks, old tabs fail with "Importing a module script failed".
// Reload once to fetch fresh chunks; guard with sessionStorage to avoid reload loops.
if (typeof window !== 'undefined') {
  const isChunkError = (msg?: string) =>
    !!msg && (/Importing a module script failed/i.test(msg) ||
              /Failed to fetch dynamically imported module/i.test(msg) ||
              /error loading dynamically imported module/i.test(msg));

  const tryReload = () => {
    const key = '__chunk_reload__';
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    window.location.reload();
  };

  window.addEventListener('error', (e) => {
    if (isChunkError(e?.message)) tryReload();
  });
  window.addEventListener('unhandledrejection', (e) => {
    const msg = (e?.reason && (e.reason.message || String(e.reason))) || '';
    if (isChunkError(msg)) tryReload();
  });

  // Clear the guard on a successful load
  window.addEventListener('load', () => sessionStorage.removeItem('__chunk_reload__'));
}

createRoot(document.getElementById("root")!).render(<App />);
