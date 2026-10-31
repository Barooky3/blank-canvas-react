import { Gift, ArrowRight } from 'lucide-react';

const TIKTOK_URL = 'https://www.tiktok.com/@frag_nerdz';

export function SampleBonusNotice({ className = '' }: { className?: string }) {
  return (
    <section
      aria-labelledby="sample-bonus-title"
      className={`rounded-xl border-2 border-[#7C3AED]/50 bg-card shadow-sm overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#7C3AED]/30 bg-[#7C3AED]/10">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#7C3AED] text-white shrink-0">
          <Gift className="h-4 w-4" aria-hidden="true" />
        </span>
        <h2 id="sample-bonus-title" className="text-sm font-bold text-foreground tracking-wide text-balance">
          Code worth more than your total? Get free samples
        </h2>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <p className="text-sm text-foreground leading-relaxed">
          For every <strong className="text-[#7C3AED]">€3</strong> your code goes over your order total, we add a free{' '}
          <strong className="text-[#7C3AED]">2ml sample</strong> to your order.
        </p>

        <div className="rounded-lg border border-border bg-muted/30 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Example</p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-md bg-background border border-border px-2.5 py-1 font-medium text-foreground">€80 order</span>
            <span className="text-muted-foreground">+</span>
            <span className="rounded-md bg-background border border-border px-2.5 py-1 font-medium text-foreground">€100 code</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="rounded-md bg-[#7C3AED] px-2.5 py-1 font-bold text-white">6 free samples</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Samples are picked at random. Want to handpick them?{' '}
          <a
            href={TIKTOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#7C3AED] underline underline-offset-2 hover:text-[#6D28D9]"
          >
            Message us on TikTok
          </a>{' '}
          with your order details and choose them.
        </p>
      </div>
    </section>
  );
}
