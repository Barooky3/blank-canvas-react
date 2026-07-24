import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const PaymentMethodExplainer = () => {
  const [open, setOpen] = useState(false);

  return (
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
              Since I'm currently under 17, I don't have access to proper payment processing yet. This means I'm unable to set up traditional payment processing like credit card terminals or Apple Pay because they require you to be above 18.
            </p>
            <p>
              For now, Rewarble codes and app-based payments are the only way I can securely accept payments. I know it's not the most convenient — but there's not much I can do. If you're in doubt or don't trust it, please do some research on Rewarble, and don't hesitate to ask me questions on{' '}
              <a href="https://www.tiktok.com/@fragranceprofs" target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium hover:text-primary/80">TikTok</a>{' '}
              if you're confused!
            </p>
            <p className="font-semibold">
              As soon as I'm able to open a bank account, normal payment methods (card payments, direct PayPal, cash on delivery, etc.) will be added right away. If you'd prefer to wait until I have the other payment methods, then feel free to do so.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodExplainer;
