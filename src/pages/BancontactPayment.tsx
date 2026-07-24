import { useState } from 'react';
import { getFirstVisitAt } from '@/utils/firstVisit';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Loader2, Lock, Copy, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';

const PAYMENT_ID = 'Parfumistry payment database 232';
const VALID_PAYMENT_ID = '23889';

const BancontactPayment = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderTotal = searchParams.get('total') || '';
  const { currency, formatPrice } = useCurrency();
  const orderTotalNum = orderTotal ? parseFloat(orderTotal) : 0;
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'pay' | 'verify'>('pay');
  const [paymentIdInput, setPaymentIdInput] = useState('');
  const [idError, setIdError] = useState<string | null>(null);
  const { clearCart } = useCart();

  const [idempotencyKey] = useState(() => {
    const existing = sessionStorage.getItem('bancontactIdempotencyKey');
    if (existing) return existing;
    const key = crypto.randomUUID();
    sessionStorage.setItem('bancontactIdempotencyKey', key);
    return key;
  });

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(PAYMENT_ID);
      toast({ title: 'Copied', description: 'Payment ID copied to clipboard.' });
    } catch {}
  };

  const handleVerifyAndSubmit = async () => {
    if (isProcessing) return;
    const entered = paymentIdInput.trim();
    if (entered !== VALID_PAYMENT_ID) {
      setIdError('Invalid Bancontact payment ID. Your payment could not be verified — the order was not placed.');
      toast({
        title: 'Payment verification failed',
        description: 'The Bancontact payment ID you entered is not valid. No order has been placed.',
        variant: 'destructive',
      });
      return;
    }
    setIdError(null);
    setIsProcessing(true);
    try {
      const orderContext = sessionStorage.getItem('checkoutOrderContext') || localStorage.getItem('checkoutOrderContext');
      if (!orderContext) { setIsProcessing(false); navigate('/checkout'); return; }
      const ctx = JSON.parse(orderContext);
      const { data } = await supabase.functions.invoke('request-order-approval', {
        body: {
          orderItems: ctx.cartItems,
          customerEmail: ctx.email,
          customerName: ctx.customerName,
          shippingAddress: { ...ctx.shippingAddress, shippingMethod: ctx.shippingMethod || 'standard' },
          totalAmount: ctx.totalAmount,
          paymentMethod: 'bancontact',
          giftCardCode: `BANCONTACT-${entered}`,
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
      sessionStorage.removeItem('bancontactIdempotencyKey');
      const orderNum = data?.orderNumber ? `&order=${data.orderNumber}` : '';
      navigate(`/checkout?completed=bancontact${orderNum}`);
    } catch (err) {
      console.error('Bancontact order error:', err);
      toast({ title: 'Order error', description: 'Could not complete your order. Please contact support.', variant: 'destructive' });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        <Link to="/checkout" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to checkout
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#005498]/10 mb-4">
            <span className="font-bold text-[#005498] text-sm tracking-tight">BC</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Pay with Bancontact</h1>
          <p className="text-xs text-muted-foreground mt-2">Recommended — full buyer protection & chargebacks</p>
        </div>

        {orderTotal && (
          <div className="rounded-xl border border-[#005498]/30 bg-[#005498]/5 p-4 mb-6 text-center">
            <p className="text-xs text-muted-foreground mb-1">Order amount</p>
            <p className="text-2xl font-bold text-foreground">€{orderTotal}</p>
            {currency !== 'EUR' && orderTotalNum > 0 && (
              <p className="text-sm text-muted-foreground mt-1">≈ {formatPrice(orderTotalNum)}</p>
            )}
          </div>
        )}

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-3.5 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground tracking-wide">How it works</h2>
          </div>
          <div className="px-5 py-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              Connect your own <strong className="text-foreground">Bancontact</strong> account and pay using your preferred payment method securely — card, Apple Pay, Google Pay, and more. You get full buyer protection and chargeback rights on every transaction.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-3.5 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground tracking-wide">Payment instructions</h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#005498] text-white text-xs font-bold shrink-0 mt-0.5">1</span>
              <div>
                <p className="text-sm font-medium text-foreground">Open your Bancontact app</p>
                <p className="text-xs text-muted-foreground mt-0.5">Sign in to your own Bancontact account.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#005498] text-white text-xs font-bold shrink-0 mt-0.5">2</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Type in this payment ID</p>
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                  <code className="flex-1 text-xs font-mono text-foreground break-all">{PAYMENT_ID}</code>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copyId}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#005498] text-white text-xs font-bold shrink-0 mt-0.5">3</span>
              <div>
                <p className="text-sm font-medium text-foreground">Choose your payment method</p>
                <p className="text-xs text-muted-foreground mt-0.5">Card, Apple Pay, Google Pay — whichever you prefer. Confirm the payment for <strong className="text-foreground">€{orderTotal || '—'}</strong>.</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3.5 py-3 mt-2">
              <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 leading-relaxed">
                Full buyer protection. Chargebacks available if your order is not delivered as described.
              </p>
            </div>
          </div>
        </div>

        {step === 'pay' ? (
          <button
            type="button"
            onClick={() => setStep('verify')}
            className="w-full h-[52px] rounded-lg text-sm font-semibold tracking-wide bg-[#005498] text-white hover:bg-[#004380] transition-colors"
          >
            I have paid
          </button>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-muted/30">
              <h2 className="text-sm font-semibold text-foreground tracking-wide">Verify your Bancontact payment</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              <label className="text-xs text-muted-foreground block">
                Enter the Bancontact payment ID from your app's confirmation
              </label>
              <Input
                value={paymentIdInput}
                onChange={(e) => { setPaymentIdInput(e.target.value); if (idError) setIdError(null); }}
                placeholder="e.g. 23889"
                disabled={isProcessing}
                inputMode="numeric"
                autoComplete="off"
                className="h-11 text-base tracking-wider"
              />
              {idError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive leading-relaxed">{idError}</p>
                </div>
              )}
              <Button
                type="button"
                onClick={handleVerifyAndSubmit}
                disabled={isProcessing || paymentIdInput.trim().length === 0}
                className="w-full h-[52px] text-sm font-semibold tracking-wide bg-[#005498] text-white hover:bg-[#004380]"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying payment…
                  </span>
                ) : (
                  'Verify & complete order'
                )}
              </Button>
              {!isProcessing && (
                <button
                  type="button"
                  onClick={() => setStep('pay')}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
              )}
            </div>
          </div>
        )}

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

export default BancontactPayment;
