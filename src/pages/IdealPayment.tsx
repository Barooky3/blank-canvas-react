import { useState } from 'react';
import { getFirstVisitAt } from '@/utils/firstVisit';
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

const IdealPayment = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderTotal = searchParams.get('total') || '';
  const { currency, formatPrice } = useCurrency();
  const orderTotalNum = orderTotal ? parseFloat(orderTotal) : 0;
  const [codes, setCodes] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('idealCodes');
    return saved ? JSON.parse(saved) : [''];
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { clearCart } = useCart();

  const updateCode = (index: number, value: string) => {
    setCodes(prev => {
      const next = [...prev];
      next[index] = value;
      sessionStorage.setItem('idealCodes', JSON.stringify(next));
      return next;
    });
  };

  const addCodeSlot = () => setCodes(prev => {
    const next = [...prev, ''];
    sessionStorage.setItem('idealCodes', JSON.stringify(next));
    return next;
  });

  const removeCodeSlot = (index: number) => {
    if (codes.length <= 1) return;
    setCodes(prev => {
      const next = prev.filter((_, i) => i !== index);
      sessionStorage.setItem('idealCodes', JSON.stringify(next));
      return next;
    });
  };

  const allCodes = codes.map(c => c.trim()).filter(Boolean);
  const combinedCode = allCodes.join(' | ');

  const [idempotencyKey] = useState(() => {
    const existing = sessionStorage.getItem('idealIdempotencyKey');
    if (existing) return existing;
    const key = crypto.randomUUID();
    sessionStorage.setItem('idealIdempotencyKey', key);
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
      sessionStorage.removeItem('idealCodes');
      sessionStorage.removeItem('idealIdempotencyKey');
      const orderNum = data?.orderNumber ? `&order=${data.orderNumber}` : '';
      navigate(`/checkout?completed=rewarble${orderNum}`);
    } catch (err: any) {
      console.error('iDEAL order error:', err);
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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#CC0066]/10 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#CC0066"/>
              <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white" fontFamily="sans-serif">iD</text>
            </svg>
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Pay with iDEAL</h1>
        </div>

        {/* Order total */}
        {orderTotal && (
          <div className="rounded-xl border border-[#CC0066]/30 bg-[#CC0066]/5 p-4 mb-6 text-center">
            <p className="text-xs text-muted-foreground mb-1">Order amount</p>
            <p className="text-2xl font-bold text-foreground">€{orderTotal}</p>
            {currency !== 'EUR' && orderTotalNum > 0 && (
              <p className="text-sm text-muted-foreground mt-1">≈ {formatPrice(orderTotalNum)}</p>
            )}
          </div>
        )}

        {/* Payment instructions */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-3.5 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground tracking-wide">Payment instructions</h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#CC0066] text-white text-xs font-bold shrink-0 mt-0.5">1</span>
              <div>
                <p className="text-sm font-medium text-foreground">Purchase a Rewarble gift card</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Buy a card closest to your cart total. At checkout, select <strong>iDEAL</strong> as your payment method.
                </p>
                <Button type="button" variant="outline" size="sm" className="mt-2 text-xs"
                  onClick={() => window.open('https://skine.com/en-ie/rewarble?utm_source=rewarble.com', '_blank')}>
                  <ExternalLink className="h-3 w-3 mr-1.5" />Buy with iDEAL
                </Button>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#CC0066] text-white text-xs font-bold shrink-0 mt-0.5">2</span>
              <div>
                <p className="text-sm font-medium text-foreground">Paste your code below</p>
                <p className="text-xs text-muted-foreground mt-0.5">Enter the Rewarble code you received after purchasing.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#CC0066] text-white text-xs font-bold shrink-0 mt-0.5">3</span>
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
              className="w-full h-10 text-sm font-medium border-[#CC0066]/30 text-[#CC0066] hover:bg-[#CC0066]/10 hover:text-[#CC0066] transition-colors"
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
              <Shield className="h-3.5 w-3.5 text-[#CC0066]" />
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
          className="w-full h-[52px] rounded-lg text-sm font-semibold tracking-wide bg-[#CC0066] hover:bg-[#A30052] text-white shadow-lg disabled:opacity-40"
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
              <AlertDialogAction className="bg-[#CC0066] hover:bg-[#A30052]" onClick={handleConfirm}>
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

export default IdealPayment;
