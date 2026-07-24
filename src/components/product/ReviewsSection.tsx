import { Star, StarHalf } from 'lucide-react';
import { ProductReview } from '@/data/productReviews';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ReviewsSectionProps {
  reviews: ProductReview[];
}

const RatingStars = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className="h-3.5 w-3.5 fill-accent text-accent" />
      ))}
      {hasHalf && <StarHalf className="h-3.5 w-3.5 fill-accent text-accent" />}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className="h-3.5 w-3.5 text-muted-foreground/30" />
      ))}
    </div>
  );
};

export const ReviewsSection = ({ reviews }: ReviewsSectionProps) => {
  if (!reviews || reviews.length === 0) return null;

  // Interleave reviews: first is always 3-4★, then alternate low/high evenly
  const sortedReviews = (() => {
    const low = reviews.filter(r => r.rating <= 4).sort((a, b) => a.rating - b.rating);
    const high = reviews.filter(r => r.rating > 4).sort((a, b) => b.rating - a.rating);
    
    // Pick the first 3-4★ review as lead
    const first = low.shift();
    if (!first) return reviews;
    
    const result: ProductReview[] = [first];
    let pickLow = false; // alternate starting with high after first low
    while (low.length > 0 || high.length > 0) {
      if (pickLow && low.length > 0) {
        result.push(low.shift()!);
      } else if (!pickLow && high.length > 0) {
        result.push(high.shift()!);
      } else if (low.length > 0) {
        result.push(low.shift()!);
      } else {
        result.push(high.shift()!);
      }
      pickLow = !pickLow;
    }
    return result;
  })();

  const avgRating = sortedReviews.reduce((sum, r) => sum + r.rating, 0) / sortedReviews.length;

  return (
    <div className="py-6 border-t border-border">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-foreground">
          Customer Reviews
        </h3>
        <div className="flex items-center gap-2">
          <RatingStars rating={Math.round(avgRating * 2) / 2} />
          <span className="text-sm text-muted-foreground">
            ({sortedReviews.length})
          </span>
        </div>
      </div>

      <div className="space-y-5">
        {sortedReviews.map((review) => (
          <div key={review.id} className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-secondary text-foreground text-xs font-medium">
                {review.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">{review.name}</span>
                {review.verified && (
                  <span className="text-[10px] tracking-wide uppercase text-accent font-medium">Verified</span>
                )}
                <span className="text-xs text-muted-foreground ml-auto shrink-0">{review.date}</span>
              </div>
              <RatingStars rating={review.rating} />
              <p className="text-sm text-foreground/80 leading-relaxed mt-1.5">
                {review.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
