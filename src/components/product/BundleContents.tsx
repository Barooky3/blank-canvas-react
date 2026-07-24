import { BundleFragrance } from '@/types/product';

interface BundleContentsProps {
  contents: BundleFragrance[];
}

export const BundleContents = ({ contents }: BundleContentsProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">What's Inside</h3>
      <div className="space-y-3">
        {contents.map((frag, i) => (
          <div
            key={i}
            className="border border-border p-4 bg-secondary/30"
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: frag.accentColor }}
              />
              {frag.affiliateUrl ? (
                <a href={frag.affiliateUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-sm text-foreground underline hover:text-accent transition-colors">{frag.name}</a>
              ) : (
                <span className="font-medium text-sm text-foreground">{frag.name}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className="text-[11px] px-2.5 py-1 rounded-full font-medium text-white"
                style={{ backgroundColor: frag.accentColor }}
              >
                Top: {frag.topNote}
              </span>
              <span
                className="text-[11px] px-2.5 py-1 rounded-full font-medium border"
                style={{ borderColor: frag.accentColor, color: frag.accentColor }}
              >
                Heart: {frag.heartNote}
              </span>
              <span
                className="text-[11px] px-2.5 py-1 rounded-full font-medium text-muted-foreground bg-muted"
              >
                Base: {frag.baseNote}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
