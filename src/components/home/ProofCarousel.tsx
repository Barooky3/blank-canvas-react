import { useEffect, useRef } from 'react';
import { Star, ChevronRight } from 'lucide-react';

const proofImages = [
  { src: '/images/proof/aventus-absolu.webp', alt: 'Aventus Absolu' },
  { src: '/images/proof/customer-tablet-shop.jpg', alt: 'Customer browsing Parfumistry' },
  { src: '/images/proof/mancera-xplicit-vanilla.jpg', alt: 'Mancera Xplicit Vanilla' },
  { src: '/images/proof/valentino-born-in-roma.jpg', alt: 'Valentino Born in Roma' },
  { src: '/images/proof/le-male-parfum-1.webp', alt: 'Le Male Parfum' },
  { src: '/images/proof/le-male-parfum-2.webp', alt: 'Le Male Parfum' },
  { src: '/images/proof/pdm-layton.webp', alt: 'Parfums de Marly Layton' },
  { src: '/images/proof/silver-mountain-water.webp', alt: 'Silver Mountain Water' },
  { src: '/images/proof/xerjoff-naxos-bottle.webp', alt: 'Xerjoff Naxos' },
  { src: '/images/proof/xerjoff-naxos-box.webp', alt: 'Xerjoff Naxos Box' },
  { src: '/images/proof/ysl-y-edp.webp', alt: 'YSL Y EDP' },
];

const ProofCarousel = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const dragState = useRef({
    isDragging: false,
    startX: 0,
    startOffset: 0,
    lastInteractionAt: 0,
  });

  const resetDrag = () => {
    dragState.current.isDragging = false;
    dragState.current.lastInteractionAt = Date.now();
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let raf: number;
    let lastTs = 0;
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const speedPxPerSecond = isMobile ? 20 : 30;

    const step = (ts: number) => {
      if (!lastTs) lastTs = ts;
      const delta = ts - lastTs;
      lastTs = ts;

      const isRecentlyInteracted = Date.now() - dragState.current.lastInteractionAt < 900;
      if (!dragState.current.isDragging && !isRecentlyInteracted) {
        offsetRef.current += (speedPxPerSecond * delta) / 1000;
        // Reset when we've scrolled past the first set of images
        const halfWidth = el.scrollWidth / 2;
        if (halfWidth > 0 && offsetRef.current >= halfWidth) {
          offsetRef.current -= halfWidth;
        }
        el.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      }

      raf = requestAnimationFrame(step);
    };

    const forceReset = () => {
      dragState.current.isDragging = false;
    };

    window.addEventListener('mouseup', forceReset);
    window.addEventListener('touchend', forceReset);
    window.addEventListener('touchcancel', forceReset);
    window.addEventListener('blur', forceReset);

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mouseup', forceReset);
      window.removeEventListener('touchend', forceReset);
      window.removeEventListener('touchcancel', forceReset);
      window.removeEventListener('blur', forceReset);
    };
  }, []);

  const handlePointerDown = (x: number) => {
    dragState.current = {
      isDragging: true,
      startX: x,
      startOffset: offsetRef.current,
      lastInteractionAt: Date.now(),
    };
  };

  const handlePointerMove = (x: number) => {
    if (!dragState.current.isDragging) return;
    dragState.current.lastInteractionAt = Date.now();
    const diff = dragState.current.startX - x;
    offsetRef.current = dragState.current.startOffset + diff;
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
    }
  };

  const onMouseDown = (e: React.MouseEvent) => handlePointerDown(e.pageX);
  const onMouseMove = (e: React.MouseEvent) => {
    if (dragState.current.isDragging) e.preventDefault();
    handlePointerMove(e.pageX);
  };
  const onTouchStart = (e: React.TouchEvent) => handlePointerDown(e.touches[0].pageX);
  const onTouchMove = (e: React.TouchEvent) => handlePointerMove(e.touches[0].pageX);

  const rating = 4.3;
  const fullStars = Math.floor(rating);
  const partialFill = (rating - fullStars) * 100;

  return (
    <section className="py-10 md:py-14 bg-background overflow-hidden">
      <div className="container mb-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-[3px]">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="relative">
                  <Star className="h-[18px] w-[18px] text-muted-foreground/30" fill="currentColor" strokeWidth={0} />
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{
                      width: i < fullStars ? '100%' : i === fullStars ? `${partialFill}%` : '0%',
                    }}
                  >
                    <Star className="h-[18px] w-[18px] fill-accent text-accent" strokeWidth={0} />
                  </div>
                </div>
              ))}
            </div>
            <span className="text-sm font-semibold text-foreground">{rating}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Based on 40+ verified reviews
          </p>
          <button
            onClick={() => {
              const el = document.getElementById('reviews-section');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="mt-2 group inline-flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase text-foreground bg-secondary/80 border border-border/80 px-4 py-2 rounded-full hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-300"
          >
            Read all reviews
            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden">
        <div
          ref={trackRef}
          className="flex gap-3 cursor-grab active:cursor-grabbing select-none px-4 will-change-transform"
          style={{ width: 'max-content' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={resetDrag}
          onMouseLeave={resetDrag}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={resetDrag}
          onTouchCancel={resetDrag}
        >
          {[...proofImages, ...proofImages].map((img, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[200px] md:w-[240px] rounded-lg overflow-hidden shadow-sm border border-border/50"
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                draggable={false}
                className="w-full h-[260px] md:h-[300px] object-cover pointer-events-none"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProofCarousel;
