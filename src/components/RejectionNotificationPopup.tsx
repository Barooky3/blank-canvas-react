import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Mail, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RejectedOrder {
  id: string;
  order_number: number | null;
  rejection_notes: string | null;
  created_at: string;
}

const DEFAULT_REASON =
  "Unfortunately, your payment could not be verified and your order has been cancelled.";

// Parse value mismatch notes like "Code value: £10.00 GBP (≈ €8.50) | Cart value: €25.00 | Missing: €16.50"
const parseValueMismatch = (notes: string | null) => {
  if (!notes) return null;
  const match = notes.match(
    /Code value:\s*(.+?)\s*\|\s*Cart value:\s*€([\d.]+)\s*\|\s*Missing:\s*€([\d.]+)/,
  );
  if (!match) return null;
  return {
    codeValue: match[1],
    cartValue: match[2],
    missingAmount: match[3],
  };
};

export const RejectionNotificationPopup = () => {
  const [rejectedOrders, setRejectedOrders] = useState<RejectedOrder[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const checkRejections = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) return;

      try {
        const { data, error } = await supabase.functions.invoke('check-rejected-orders', {});
        if (error || !data?.rejectedOrders?.length) return;
        setRejectedOrders(data.rejectedOrders);
        setOpen(true);
      } catch {
        // silently fail
      }
    };

    const timer = setTimeout(checkRejections, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = async () => {
    const current = rejectedOrders[currentIndex];
    if (current) {
      try {
        await supabase.functions.invoke('mark-rejection-seen', {
          body: { orderIds: [current.id] },
        });
      } catch {
        // silently fail
      }
    }

    if (currentIndex < rejectedOrders.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setOpen(false);
    }
  };

  const current = rejectedOrders[currentIndex];
  if (!current) return null;

  const mismatchData = parseValueMismatch(current.rejection_notes);
  const isValueMismatch = !!mismatchData;
  const reason = isValueMismatch
    ? 'The value of the gift card you provided does not match your cart total.'
    : current.rejection_notes?.trim() || DEFAULT_REASON;
  const orderLabel = current.order_number ? `#${current.order_number}` : '';

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-lg">
              Order {orderLabel} Rejected
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm leading-relaxed">
            {reason}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isValueMismatch && mismatchData && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg p-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-amber-700 dark:text-amber-400">Code value:</span>
                <span className="font-semibold text-amber-900 dark:text-amber-200">
                  {mismatchData.codeValue}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700 dark:text-amber-400">Cart value:</span>
                <span className="font-semibold text-amber-900 dark:text-amber-200">
                  €{mismatchData.cartValue}
                </span>
              </div>
              <div className="h-px bg-amber-300 dark:bg-amber-700 my-1" />
              <div className="flex justify-between">
                <span className="text-amber-700 dark:text-amber-400 font-medium">
                  Missing amount:
                </span>
                <span className="font-bold text-destructive">
                  €{mismatchData.missingAmount}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* How to fix */}
        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            How to fix this:
          </h4>
          {isValueMismatch && mismatchData ? (
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>
                Buy a new gift card to cover the missing{' '}
                <strong className="text-foreground">€{mismatchData.missingAmount}</strong>.
              </li>
              <li>Add the same items to your cart again.</li>
              <li>
                At checkout, enter <strong className="text-foreground">both codes</strong> —
                the original one plus the new one.
              </li>
              <li>Submit your order and we'll verify both codes.</li>
            </ol>
          ) : (
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Re-add the items to your cart.</li>
              <li>Try again with a valid payment code or a different payment method.</li>
              <li>If you keep having trouble, reply to our email and we'll help.</li>
            </ol>
          )}
        </div>

        {/* Check email reminder */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 border border-border rounded-lg p-3">
          <Mail className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            We've sent the full details to your email. Please check your inbox (and spam
            folder) for more information.
          </p>
        </div>

        <AlertDialogFooter>
          {rejectedOrders.length > 1 && (
            <p className="text-xs text-muted-foreground mr-auto self-center">
              {currentIndex + 1} of {rejectedOrders.length}
            </p>
          )}
          <AlertDialogAction onClick={handleDismiss}>
            {currentIndex < rejectedOrders.length - 1 ? 'Next' : 'I Understand'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
