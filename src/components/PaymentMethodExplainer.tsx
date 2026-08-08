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
              Paying through a Rewarble gift card is offered specifically to help our customers avoid additional government taxes on their order. You pay Rewarble with your normal method (iDEAL, PayPal, card, Apple Pay) — completely optional, and it protects your order.
            </p>
            <p>
              iDEAL, card, Apple Pay and Google Pay are also available at checkout. If you're in doubt or don't trust it, please do some research on Rewarble, and don't hesitate to ask me questions on{' '}
              <a href="https://www.tiktok.com/@parfora_xs" target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium hover:text-primary/80">TikTok</a>{' '}
              if you're confused!
            </p>
            <p className="pt-2 mt-2 border-t border-amber-500/20">
              If for whatever reason you do not wish to pay using this method, then our company will obtain full registration on the 1st of August 2027, and you may wait until then if you wish — we will have normal payment methods by then.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodExplainer;
