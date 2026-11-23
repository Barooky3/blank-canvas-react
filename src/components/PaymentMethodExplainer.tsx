import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';

const PaymentMethodExplainer = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
    <div className="rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-amber-100/50 dark:hover:bg-amber-950/30"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/15 shrink-0">
          <HelpCircle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
        </div>
        <span className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex-1">
          Why are the payment methods like this?
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed border-t border-amber-500/20">
          <div className="pt-3 space-y-2">
            <p>
              Since I'm currently under 18, I don't have access to proper payment processing yet. This means I'm unable to set up traditional payment processing like credit card terminals or Apple Pay because they require you to be above 18.
            </p>
            <p>
              For now, Rewup codes and app-based payments are the only way I can securely accept payments. I know it's not the most convenient — but there's not much I can do. If you're in doubt or don't trust it, please do some research on Rewup.
            </p>
            <p className="font-semibold">
              As soon as I'm able to open a bank account, normal payment methods (card payments, direct PayPal, cash on delivery to other countries, etc.) will be added right away. If you'd prefer to wait until I have the other payment methods, then feel free to do so 👍
            </p>
          </div>
        </div>
      )}
      </div>
      <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          <strong className="text-foreground">Disclaimer:</strong> If you don&apos;t want to pay using the current payment methods, you can wait until <strong className="text-foreground">22 August 2027</strong>. That&apos;s when normal payment methods and cash on delivery to other countries will be available.
        </span>
      </p>
    </div>
  );
};

export default PaymentMethodExplainer;
