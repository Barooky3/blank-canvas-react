import { Gift } from 'lucide-react';

const TIKTOK_URL = 'https://www.tiktok.com/@frag_nerdz';

export function SampleBonusNotice({ className = '' }: { className?: string }) {
  return (
    <div
      role="note"
      className={`rounded-xl border-2 border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/40 p-4 flex gap-3 ${className}`}
    >
      <Gift className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" aria-hidden="true" />
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
          Code worth more than your total? You get free samples
        </p>
        <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
          For every <strong>€3</strong> your code exceeds your order total, a free <strong>2ml sample</strong> is added to your order.
        </p>
        <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
          <strong>Example:</strong> your order is €80 and you use a €100 code, so you get <strong>6 free samples</strong> added to your order.
        </p>
        <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
          Samples are selected at random. Want to handpick them?{' '}
          <a
            href={TIKTOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2 hover:text-emerald-950 dark:hover:text-emerald-100"
          >
            Message us on TikTok
          </a>{' '}
          with your order details and choose them.
        </p>
      </div>
    </div>
  );
}
