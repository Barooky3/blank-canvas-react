import { useState, useRef } from 'react';
import { getFirstVisitAt } from '@/utils/firstVisit';
import PaymentMethodExplainer from '@/components/PaymentMethodExplainer';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, Shield, CheckCircle, AlertTriangle, Loader2, ExternalLink, Plus, X, Lock, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
const REWARBLE_G2A_URL = 'https://www.g2a.com/paypal-gift-card-60-eur-by-rewarble-global-i10000339995001';

const Rewarble = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderTotal = searchParams.get('total') || '';
  const { currency, formatPrice } = useCurrency();
  const orderTotalNum = orderTotal ? parseFloat(orderTotal) : 0;
  const [codes, setCodes] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('rewarbleCodes');
    return saved ? JSON.parse(saved) : [''];
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { clearCart } = useCart();
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFullscreen = () => {
    const v = videoRef.current as any;
    if (!v) return;
    try {
      if (v.webkitEnterFullscreen) { v.webkitEnterFullscreen(); return; }
      if (v.requestFullscreen) { v.requestFullscreen(); return; }
      if (v.webkitRequestFullscreen) { v.webkitRequestFullscreen(); return; }
      if (v.msRequestFullscreen) { v.msRequestFullscreen(); return; }
    } catch (e) {
      // Fallback: open the video file in a new tab
      window.open('/videos/rewarble-tutorial.mp4', '_blank');
    }
  };

  const updateCode = (index: number, value: string) => {
    setCodes(prev => {
      const next = [...prev];
      next[index] = value;
      sessionStorage.setItem('rewarbleCodes', JSON.stringify(next));
      return next;
    });
  };

  const addCodeSlot = () => setCodes(prev => {
    const next = [...prev, ''];
    sessionStorage.setItem('rewarbleCodes', JSON.stringify(next));
    return next;
  });

  const removeCodeSlot = (index: number) => {
    if (codes.length <= 1) return;
    setCodes(prev => {
      const next = prev.filter((_, i) => i !== index);
      sessionStorage.setItem('rewarbleCodes', JSON.stringify(next));
      return next;
    });
  };

  const allCodes = codes.map(c => c.trim()).filter(Boolean);
  const combinedCode = allCodes.join(' | ');

  // Generate a stable idempotency key per session to prevent duplicate orders
  const [idempotencyKey] = useState(() => {
    const existing = sessionStorage.getItem('rewarbleIdempotencyKey');
    if (existing) return existing;
    const key = crypto.randomUUID();
    sessionStorage.setItem('rewarbleIdempotencyKey', key);
    return key;
  });

  const handleConfirm = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setShowConfirmDialog(false);
    try {
      const orderContext = sessionStorage.getItem('checkoutOrderContext') || localStorage.getItem('checkoutOrderContext');
      if (!orderContext) {
        setIsProcessing(false);
        navigate('/checkout');
        return;
      }
      const ctx = JSON.parse(orderContext);
      const { data } = await supabase.functions.invoke('request-order-approval', {
        body: {
          orderItems: ctx.cartItems,
          customerEmail: ctx.email,
          customerName: ctx.customerName,
          shippingAddress: { ...ctx.shippingAddress, shippingMethod: ctx.shippingMethod || "standard" },
          totalAmount: ctx.totalAmount,
          paymentMethod: 'rewarble',
          giftCardCode: combinedCode,
          discountCode: ctx.discountCode || null,
          discountPercent: ctx.discountPercent || 0,
          idempotencyKey,
          firstVisitAt: getFirstVisitAt(),
        },
      });
      clearCart();
      sessionStorage.removeItem('checkoutOrderContext');
      try { localStorage.removeItem('checkoutOrderContext'); } catch {}
      sessionStorage.removeItem('checkoutFormData');
      sessionStorage.removeItem('rewarbleCodes');
      sessionStorage.removeItem('rewarbleIdempotencyKey');
      const orderNum = data?.orderNumber ? `&order=${data.orderNumber}` : '';
      navigate(`/checkout?completed=rewarble${orderNum}`);
    } catch (err: any) {
      console.error('Rewarble order error:', err);
      toast({ title: 'Order error', description: 'Could not complete your order. Please contact support.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg md:max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Back link */}
        <Link to="/checkout" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to checkout
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#7C3AED]/10 mb-4">
            <Gift className="h-7 w-7 text-[#7C3AED]" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Pay with Rewarble</h1>
        </div>

        {/* Order total */}
        {orderTotal && (
          <div className="rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/5 p-4 mb-6 text-center">
            <p className="text-xs text-muted-foreground mb-1">Order amount</p>
            <p className="text-2xl font-bold text-foreground">€{orderTotal}</p>
            {currency !== 'EUR' && orderTotalNum > 0 && (
              <p className="text-sm text-muted-foreground mt-1">≈ {formatPrice(orderTotalNum)}</p>
            )}
          </div>
        )}

        {/* Step 1: Purchase */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 mb-4 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300 leading-relaxed">Please follow the payment instructions carefully to avoid delays with your order.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Payment instructions */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-muted/30">
              <h2 className="text-sm font-semibold text-foreground tracking-wide">Payment instructions</h2>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#7C3AED] text-white text-xs font-bold shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-sm font-medium text-foreground">Purchase a PayPal Rewarble gift card on G2A</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {orderTotalNum > 0 ? (
                      <>Your cart total is <strong>€{orderTotal}</strong>. Tap the button below to open the PayPal Rewarble listing on G2A, press the <strong>"+more"</strong> button under <em>Amount</em>, and pick any card value that covers your total. Then check out on G2A using whichever method you prefer (Visa, Mastercard, Apple Pay, Google Pay, Paysafecard, and many more).</>
                    ) : (
                      <>Tap the button below to open the PayPal Rewarble listing on G2A, press the <strong>"+more"</strong> button under <em>Amount</em>, and pick any card value that covers your cart total.</>
                    )}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[11px] text-muted-foreground/80 bg-muted/50 px-2 py-0.5 rounded">Visa</span>
                    <span className="text-[11px] text-muted-foreground/80 bg-muted/50 px-2 py-0.5 rounded">Mastercard</span>
                    <span className="text-[11px] text-muted-foreground/80 bg-muted/50 px-2 py-0.5 rounded">Apple Pay</span>
                    <span className="text-[11px] text-muted-foreground/80 bg-muted/50 px-2 py-0.5 rounded">Google Pay</span>
                    <span className="text-[11px] text-muted-foreground/80 bg-muted/50 px-2 py-0.5 rounded">Paysafecard</span>
                    <span className="text-[11px] text-muted-foreground/80 bg-muted/50 px-2 py-0.5 rounded">& more</span>
                  </div>
                  <div className="rounded-md border border-sky-500/30 bg-sky-50 dark:bg-sky-950/20 px-3 py-2 mt-2 flex items-start gap-2">
                    <Shield className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-medium text-sky-800 dark:text-sky-300 leading-relaxed">
                      You do <strong>not</strong> need a PayPal account to complete this payment — G2A checkout accepts cards and many other methods.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="mt-2 text-xs"
                    onClick={() => window.open(REWARBLE_G2A_URL, '_blank')}>
                    <ExternalLink className="h-3 w-3 mr-1.5" />
                    Open PayPal Rewarble on G2A
                  </Button>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#7C3AED] text-white text-xs font-bold shrink-0 mt-0.5">2</span>
                <div>
                  <p className="text-sm font-medium text-foreground">Get your Rewarble code by email</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Right after purchase, G2A sends the PayPal Rewarble code straight to the email you used at G2A checkout — usually within a minute or two. Open the email, copy the 16-character code (letters and numbers — <strong>not</strong> the long order number that starts with <strong>#</strong>), come back to this page, and paste it into the field below.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#7C3AED] text-white text-xs font-bold shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-sm font-medium text-foreground">Confirm your payment</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Press the green "Confirm Payment" button at the bottom. Your code is sent to Rewarble for validation, your order is placed as pending, and you'll get a confirmation email. Funds are only released to me once your delivery has arrived safely.
                  </p>
                </div>
              </div>

              {/* Video Tutorial — mobile only, appended to instructions */}
              <div className="md:hidden pt-3 border-t border-border">
                <p className="text-xs font-semibold text-foreground tracking-wide mb-2">Watch how it works</p>
                <div className="relative rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full aspect-video bg-black rounded-lg"
                  >
                    <source src="/videos/rewarble-tutorial.mp4" type="video/mp4" />
                  </video>
                  <button
                    type="button"
                    onClick={handleFullscreen}
                    aria-label="Fullscreen"
                    className="absolute top-2 right-2 z-10 rounded-md bg-black/60 hover:bg-black/80 text-white p-2 backdrop-blur-sm transition-colors"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                  Step-by-step: open the G2A Rewarble page → tap "+more" and pick your amount → pay with your preferred method → receive your code by email → paste it here and confirm.
                </p>
              </div>

              <div className="mt-2 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Confused or need help?{' '}
                  <a href="https://www.tiktok.com/@fragranceprofs" target="_blank" rel="noopener noreferrer" className="text-accent font-medium hover:underline">
                    Contact us on TikTok
                  </a>
                </p>
                <div className="mt-3">
                  <PaymentMethodExplainer />
                </div>
              </div>
            </div>
          </div>

          {/* Video Tutorial — desktop only */}
          <div className="hidden md:flex rounded-xl border border-border bg-card shadow-sm overflow-hidden flex-col">
            <div className="px-5 py-3.5 border-b border-border bg-muted/30">
              <h2 className="text-sm font-semibold text-foreground tracking-wide">Watch how it works</h2>
            </div>
            <div className="p-0 relative flex-1">
              <video
                controls
                playsInline
                preload="metadata"
                className="w-full h-full min-h-[200px] aspect-video bg-black"
              >
                <source src="/videos/rewarble-tutorial.mp4" type="video/mp4" />
              </video>
              <button
                type="button"
                onClick={handleFullscreen}
                aria-label="Fullscreen"
                className="absolute top-2 right-2 z-10 rounded-md bg-black/60 hover:bg-black/80 text-white p-2 backdrop-blur-sm transition-colors"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">
              Step-by-step: open the G2A Rewarble page → tap "+more" and pick your amount → pay with your preferred method → receive your code by email → paste it here and confirm.
              </p>
            </div>
          </div>
        </div>


        {/* Payment logos */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <svg width="44" height="30" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="0.5" width="47" height="31" rx="3.5" fill="#1A1F71" stroke="#2A2F81"/>
            <text x="24" y="20" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Arial, sans-serif">VISA</text>
          </svg>
          <svg width="44" height="30" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="0.5" width="47" height="31" rx="3.5" fill="#fff" stroke="#ddd"/>
            <circle cx="19" cy="16" r="8" fill="#EB001B"/>
            <circle cx="29" cy="16" r="8" fill="#F79E1B"/>
            <path d="M24 9.8a8 8 0 0 1 0 12.4 8 8 0 0 1 0-12.4z" fill="#FF5F00"/>
          </svg>
          <div className="w-[44px] h-[30px] rounded border border-border overflow-hidden bg-white flex items-center justify-center">
            <img src="/images/apple-pay.png" alt="Apple Pay" className="h-full w-full object-contain" />
          </div>
          <div className="w-[44px] h-[30px] rounded border border-border overflow-hidden bg-white flex items-center justify-center">
            <img src="/images/google-pay.png" alt="Google Pay" className="h-full w-full object-contain" />
          </div>
          <div className="w-[44px] h-[30px] rounded border border-border overflow-hidden bg-white flex items-center justify-center">
            <img src="/images/paysafecard.png" alt="Paysafecard" className="h-full w-full object-contain" />
          </div>
        </div>

        {/* Code Inputs */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-3.5 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground tracking-wide">Enter your code{codes.length > 1 ? 's' : ''}</h2>
          </div>
          <div className="p-5 space-y-3">
            {codes.map((code, i) => (
              <div key={i}>
                <Label className="text-xs font-medium tracking-wider text-foreground">
                  REWARBLE CODE {codes.length > 1 ? `#${i + 1}` : ''}
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="text"
                    placeholder="Paste your Rewarble code here..."
                    value={code}
                    onChange={(e) => updateCode(i, e.target.value)}
                    className="h-12 bg-background border-border rounded-md font-mono flex-1"
                  />
                  {codes.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-12 w-12 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeCodeSlot(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addCodeSlot}
              className="w-full h-10 text-sm font-medium border-[#7C3AED]/30 text-[#7C3AED] hover:bg-[#7C3AED]/10 hover:text-[#7C3AED] transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add another code
            </Button>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3.5 py-2.5 mt-1.5">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-0.5">⚠ Send the Rewarble code, not the order number</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">The Rewarble code contains <strong>letters and numbers</strong> and should look something like this: <strong className="font-mono">9YVMBH7H4CXHCX7J</strong>. The Rewarble order number (digits only, starting with # e.g. <strong className="font-mono">#92000148383033</strong>) cannot be used.</p>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3.5 py-3 mt-2">
              <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 leading-relaxed">
                Once you paste your code and confirm, it is sent to Rewarble for validation. The code is only released after you have received your delivery.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-4 mt-4 border-t border-border/60">
              <Shield className="h-3.5 w-3.5 text-[#7C3AED]" />
              <span className="text-xs text-muted-foreground">Secure verification powered by</span>
              <img src="/images/rewarble-icon.svg" alt="Rewarble" className="h-5 w-5" />
              <span className="text-sm font-semibold text-foreground">Rewarble</span>
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <Button
          type="button"
          disabled={allCodes.length === 0 || isProcessing}
          className="w-full h-[52px] rounded-lg text-sm font-semibold tracking-wide bg-green-600 hover:bg-green-700 text-white shadow-lg disabled:opacity-40"
          onClick={() => setShowConfirmDialog(true)}
        >
          {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-2" />Confirm Payment</>}
        </Button>

        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Payment Confirmation
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-relaxed">
                <span className="font-semibold text-red-500 block mb-2">
                  Orders confirmed with invalid Rewarble codes will be rejected upon review.
                </span>
                Your Rewarble code{allCodes.length > 1 ? 's' : ''} will be verified before your order is processed. If any code is invalid or has already been used, your order will be rejected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Go Back</AlertDialogCancel>
              <AlertDialogAction className="bg-green-600 hover:bg-green-700" onClick={handleConfirm}>
                Yes, Confirm Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>



        {/* Trust badges */}
        <div className="flex flex-col items-center gap-2 pt-4 mt-4 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-accent" />
            <span className="text-[11px]">Secure checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rewarble;
