import { useState } from 'react';
import { getFirstVisitAt } from '@/utils/firstVisit';
import PaymentMethodExplainer from '@/components/PaymentMethodExplainer';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle, AlertTriangle, Loader2, ExternalLink, Plus, X, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';

const PaypalEneba = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderTotal = searchParams.get('total') || '';
  const { currency, formatPrice } = useCurrency();
  const orderTotalNum = orderTotal ? parseFloat(orderTotal) : 0;
  const [codes, setCodes] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('paypalEnebaCodes');
    return saved ? JSON.parse(saved) : [''];
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { clearCart } = useCart();

  const updateCode = (index: number, value: string) => {
    setCodes(prev => {
      const next = [...prev];
      next[index] = value;
      sessionStorage.setItem('paypalEnebaCodes', JSON.stringify(next));
      return next;
    });
  };

  const addCodeSlot = () => setCodes(prev => {
    const next = [...prev, ''];
    sessionStorage.setItem('paypalEnebaCodes', JSON.stringify(next));
    return next;
  });

  const removeCodeSlot = (index: number) => {
    if (codes.length <= 1) return;
    setCodes(prev => {
      const next = prev.filter((_, i) => i !== index);
      sessionStorage.setItem('paypalEnebaCodes', JSON.stringify(next));
      return next;
    });
  };

  const allCodes = codes.map(c => c.trim()).filter(Boolean);
  const combinedCode = allCodes.join(' | ');

  // Generate a stable idempotency key per session to prevent duplicate orders
  const [idempotencyKey] = useState(() => {
    const existing = sessionStorage.getItem('paypalIdempotencyKey');
    if (existing) return existing;
    const key = crypto.randomUUID();
    sessionStorage.setItem('paypalIdempotencyKey', key);
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
      sessionStorage.removeItem('paypalEnebaCodes');
      sessionStorage.removeItem('paypalIdempotencyKey');
      const orderNum = data?.orderNumber ? `&order=${data.orderNumber}` : '';
      navigate(`/checkout?completed=rewarble${orderNum}`);
    } catch (err: any) {
      console.error('PayPal/Eneba order error:', err);
      toast({ title: 'Order error', description: 'Could not complete your order. Please contact support.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        {/* Back link */}
        <Link to="/checkout" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to checkout
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#0070BA]/10 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.645h6.527c2.168 0 3.87.458 5.048 1.36 1.236.945 1.86 2.378 1.86 4.26 0 .376-.04.758-.117 1.15-.727 3.655-3.25 5.507-7.516 5.507H9.522a.77.77 0 0 0-.757.645l-1.69 5.34z" fill="#003087"/>
              <path d="M20.16 8.848c-.727 3.655-3.25 5.507-7.516 5.507H10.66a.77.77 0 0 0-.757.645l-1.15 3.63-.486 3.085a.641.641 0 0 0 .633.74h3.34a.77.77 0 0 0 .757-.645l.632-3.18a.77.77 0 0 1 .757-.645h1.594c4.267 0 6.79-1.852 7.516-5.507.41-2.06-.076-3.655-1.337-4.63z" fill="#0070BA"/>
            </svg>
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Pay with PayPal</h1>
        </div>

        {/* Order total */}
        {orderTotal && (
          <div className="rounded-xl border border-[#0070BA]/30 bg-[#0070BA]/5 p-4 mb-6 text-center">
            <p className="text-xs text-muted-foreground mb-1">Order amount</p>
            <p className="text-2xl font-bold text-foreground">€{orderTotal}</p>
            {currency !== 'EUR' && orderTotalNum > 0 && (
              <p className="text-sm text-muted-foreground mt-1">≈ {formatPrice(orderTotalNum)}</p>
            )}
          </div>
        )}

        {/* Payment instructions */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 mb-4 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300 leading-relaxed">Please follow the payment instructions carefully to avoid delays with your order.</p>
        </div>
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-3.5 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground tracking-wide">Payment instructions</h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0070BA] text-white text-xs font-bold shrink-0 mt-0.5">1</span>
              <div>
                <p className="text-sm font-medium text-foreground">Purchase a Rewarble voucher on Eneba</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Buy a voucher closest to your cart total. At Eneba checkout, select <strong>PayPal</strong> as your payment method.
                </p>
                <Button type="button" variant="outline" size="sm" className="mt-2 text-xs"
                  onClick={() => window.open('https://www.eneba.com/rewarble-rewarble-revolut-5-gbp-voucher-global', '_blank')}>
                  <ExternalLink className="h-3 w-3 mr-1.5" />Buy on Eneba with PayPal
                </Button>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0070BA] text-white text-xs font-bold shrink-0 mt-0.5">2</span>
              <div>
                <p className="text-sm font-medium text-foreground">Paste your code below</p>
                <p className="text-xs text-muted-foreground mt-0.5">Enter the Rewarble code you received after purchasing on Eneba.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0070BA] text-white text-xs font-bold shrink-0 mt-0.5">3</span>
              <div>
                <p className="text-sm font-medium text-foreground">Confirm your payment</p>
                <p className="text-xs text-muted-foreground mt-0.5">Your code is sent to Rewarble for validation. Funds are only released once delivery to your address is complete.</p>
              </div>
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
              className="w-full h-10 text-sm font-medium border-[#0070BA]/30 text-[#0070BA] hover:bg-[#0070BA]/10 hover:text-[#0070BA] transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add another code
            </Button>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3.5 py-2.5 mt-1.5">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-0.5">⚠ Send the gift card code, not the order number</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">The gift card code contains <strong>letters and numbers</strong> and should look something like this: <strong className="font-mono">9YVMBH7H4CXHCX7J</strong>. The Rewarble order number (digits only, starting with #) cannot be used.</p>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3.5 py-3 mt-2">
              <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 leading-relaxed">
                Once you paste your code and confirm, it is sent to Rewarble for validation. The code is only released after you have received your delivery.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-4 mt-4 border-t border-border/60">
              <Shield className="h-3.5 w-3.5 text-[#0070BA]" />
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
          className="w-full h-[52px] rounded-lg text-sm font-semibold tracking-wide bg-[#0070BA] hover:bg-[#005C99] text-white shadow-lg disabled:opacity-40"
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
              <AlertDialogAction className="bg-[#0070BA] hover:bg-[#005C99]" onClick={handleConfirm}>
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

export default PaypalEneba;
