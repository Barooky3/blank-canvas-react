import { lazy, Suspense, type ComponentType } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Layout } from "@/components/layout";
import { ScrollToTop } from "@/components/ScrollToTop";

const isDynamicImportError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(message);
};

const lazyWithReload = <T extends ComponentType<unknown>>(loader: () => Promise<{ default: T }>) =>
  lazy(() =>
    loader().catch((error) => {
      if (typeof window !== 'undefined' && isDynamicImportError(error)) {
        const key = '__route_chunk_reload__';
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          window.location.reload();
          return new Promise<{ default: T }>(() => undefined);
        }
      }
      throw error;
    })
  );

const Index = lazyWithReload(() => import("./pages/Index"));

// Lazy-loaded routes for code splitting
const Shop = lazyWithReload(() => import("./pages/Shop"));
const ProductDetail = lazyWithReload(() => import("./pages/ProductDetail"));
const Checkout = lazyWithReload(() => import("./pages/Checkout"));
const Contact = lazyWithReload(() => import("./pages/Contact"));
const Login = lazyWithReload(() => import("./pages/Login"));
const Signup = lazyWithReload(() => import("./pages/Signup"));
const Account = lazyWithReload(() => import("./pages/Account"));
const TermsOfService = lazyWithReload(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazyWithReload(() => import("./pages/PrivacyPolicy"));
const AdminOrders = lazyWithReload(() => import("./pages/AdminOrders"));
const ReturnPolicy = lazyWithReload(() => import("./pages/ReturnPolicy"));
const Rewarble = lazyWithReload(() => import("./pages/Rewarble"));
const PaypalEneba = lazyWithReload(() => import("./pages/PaypalEneba"));
const IdealPayment = lazyWithReload(() => import("./pages/IdealPayment"));
const RevolutApp = lazyWithReload(() => import("./pages/RevolutApp"));
const BancontactPayment = lazyWithReload(() => import("./pages/BancontactPayment"));
const ResetPassword = lazyWithReload(() => import("./pages/ResetPassword"));
const ProofUpload = lazyWithReload(() => import("./pages/ProofUpload"));
const EmailPreview = lazyWithReload(() => import("./pages/EmailPreview"));
const CustomBundle = lazyWithReload(() => import("./pages/CustomBundle"));
const FAQ = lazyWithReload(() => import("./pages/FAQ"));
const TrackOrder = lazyWithReload(() => import("./pages/TrackOrder"));

const NotFound = lazyWithReload(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
      <LanguageProvider>
      <CurrencyProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Layout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/:category" element={<Shop />} />
                <Route path="/collection" element={<Shop />} />
                <Route path="/men" element={<Shop />} />
                <Route path="/women" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/account" element={<Account />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/return-policy" element={<ReturnPolicy />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/rewarble" element={<Rewarble />} />
                <Route path="/paypal" element={<PaypalEneba />} />
                <Route path="/ideal" element={<IdealPayment />} />
                <Route path="/revolut" element={<RevolutApp />} />
                <Route path="/bancontact" element={<BancontactPayment />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/proof" element={<ProofUpload />} />
                <Route path="/email-preview" element={<EmailPreview />} />
                <Route path="/custom-bundle" element={<CustomBundle />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/track-submit" element={<TrackOrder />} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Layout>
        </BrowserRouter>
      </CartProvider>
      </CurrencyProvider>
      </LanguageProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
