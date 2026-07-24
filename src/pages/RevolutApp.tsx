import { useState } from 'react';
import { getFirstVisitAt } from '@/utils/firstVisit';
import PaymentMethodExplainer from '@/components/PaymentMethodExplainer';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Copy, Check, CheckCircle, AlertTriangle, Loader2, Info, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';

const REVTAG = '@profparfumz';

const RevolutApp = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderTotal = searchParams.get('total') || '';
  const [copiedRevtag, setCopiedRevtag] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { clearCart } = useCart();

  const handleCopyRevtag = () => {
    navigator.clipboard.writeText(REVTAG);
    setCopiedRevtag(true);
    toast({ title: 'Copied!', description: 'Revtag copied to clipboard' });
    setTimeout(() => setCopiedRevtag(false), 2000);
  };

  // Generate a stable idempotency key per session to prevent duplicate orders
  const [idempotencyKey] = useState(() => {
    const existing = sessionStorage.getItem('revolutIdempotencyKey');
    if (existing) return existing;
    const key = crypto.randomUUID();
    sessionStorage.setItem('revolutIdempotencyKey', key);
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
          paymentMethod: 'revolut_app',
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
      sessionStorage.removeItem('revolutIdempotencyKey');
      navigate(`/checkout?completed=revolut_app`);
    } catch (err: any) {
      console.error('Revolut app order error:', err);
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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#191C1F]/10 mb-4">
            <Smartphone className="h-7 w-7 text-[#191C1F] dark:text-white" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Pay with Revolut</h1>
        </div>

        {/* Order total */}
        {orderTotal && (
          <div className="rounded-xl border border-[#191C1F]/20 bg-[#191C1F]/5 p-4 mb-6 text-center">
            <p className="text-xs text-muted-foreground mb-1">Amount to send</p>
            <p className="text-2xl font-bold text-foreground">€{orderTotal}</p>
          </div>
        )}

        {/* Revtag Card */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-3.5 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground tracking-wide">Revtag</h2>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Send to</p>
              <p className="text-lg font-bold text-foreground font-mono tracking-wide">{REVTAG}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              onClick={handleCopyRevtag}
            >
              {copiedRevtag ? (
                <Check className="h-4 w-4 text-accent" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 mb-4 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300 leading-relaxed">Please follow the payment instructions carefully to avoid delays with your order.</p>
        </div>
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-3.5 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground tracking-wide">How it works</h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#191C1F] text-white text-xs font-bold shrink-0 mt-0.5">1</span>
              <div>
                <p className="text-sm font-medium text-foreground">Open your Revolut app</p>
                <p className="text-xs text-muted-foreground mt-0.5">Go to the "Send" or "Pay" section in the app.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#191C1F] text-white text-xs font-bold shrink-0 mt-0.5">2</span>
              <div>
                <p className="text-sm font-medium text-foreground">Search for our Revtag</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tap "Send to someone new" and search for <strong className="font-mono">{REVTAG}</strong>
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#191C1F] text-white text-xs font-bold shrink-0 mt-0.5">3</span>
              <div>
                <p className="text-sm font-medium text-foreground">Send the exact amount</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {orderTotal ? `Send exactly €${orderTotal}.` : 'Send the exact order total.'} Add a note with the email you used at checkout.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#191C1F] text-white text-xs font-bold shrink-0 mt-0.5">4</span>
              <div>
                <p className="text-sm font-medium text-foreground">Click "Confirm Payment Sent" below</p>
                <p className="text-xs text-muted-foreground mt-0.5">Once you've sent the money, confirm it to place your order.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info note */}
        <div className="flex gap-2.5 rounded-lg bg-muted/40 border border-border/50 px-4 py-3 mb-4">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Revolut-to-Revolut transfers are instant and free. Your order will be processed as soon as we confirm payment.
          </p>
        </div>

        {/* Region restriction disclaimer */}
        <div className="flex gap-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-4 py-3 mb-4">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Can't find the Revtag?</strong> This may be due to regional restrictions in your country. If you're unable to locate the account, please go back and use one of our other payment methods instead.
          </p>
        </div>

        {/* Why are payment methods like this */}
        <div className="mb-6">
          <PaymentMethodExplainer />
        </div>

        {/* Confirm Button */}
        <Button
          type="button"
          disabled={isProcessing}
          className="w-full h-[52px] rounded-lg text-sm font-semibold tracking-wide bg-green-600 hover:bg-green-700 text-white shadow-lg disabled:opacity-40"
          onClick={() => setShowConfirmDialog(true)}
        >
          {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-2" />Confirm Payment Sent</>}
        </Button>

        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Confirm Revolut Payment
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-relaxed">
                <span className="font-semibold text-foreground block mb-2">
                  Please confirm that you have sent the payment via Revolut to {REVTAG}.
                </span>
                Your order will be placed as pending and processed once we verify the payment. Revolut transfers are usually instant.
                <span className="font-semibold text-red-500 block mt-2">
                  Orders confirmed without a valid Revolut payment will be rejected.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Go Back</AlertDialogCancel>
              <AlertDialogAction className="bg-green-600 hover:bg-green-700" onClick={handleConfirm}>
                Yes, I've Sent the Payment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>



        {/* Trust badges */}
        <div className="flex flex-col items-center gap-2 pt-4 mt-4 border-t border-border/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-accent" />
              <span className="text-[11px]">Secure</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Smartphone className="h-3.5 w-3.5 text-accent" />
              <span className="text-[11px]">Instant transfer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevolutApp;
