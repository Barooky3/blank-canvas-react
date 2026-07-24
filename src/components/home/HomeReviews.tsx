import { useMemo, useState } from 'react';
import { Star, Plus, ChevronLeft, ChevronRight, LogIn, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReviews, applyReviewOrder, useReviewOrder } from '@/hooks/useReviews';
import { ReviewItem } from '@/components/reviews/ReviewItem';
import { ReviewSubmitDialog } from '@/components/reviews/ReviewSubmitDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const PAGE_SIZE = 8;

const SortableReviewRow = ({
  id,
  isAdmin,
  children,
}: {
  id: string;
  isAdmin: boolean;
  children: React.ReactNode;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    background: isDragging ? 'hsl(var(--muted) / 0.3)' : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} className="relative flex items-start">
      {isAdmin && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-6 mr-2 p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
};

const RatingStars = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) => {
  const cls = size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${cls} ${i <= Math.round(rating) ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
};

const HomeReviews = () => {
  const { visibleReviews, isAdmin, refresh } = useReviews();
  const { user } = useAuth();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [filter, setFilter] = useState<number | 'all'>('all');
  const [page, setPage] = useState(1);

  const [order, setOrder] = useReviewOrder();

  const sorted = useMemo(() => {
    const base = [...visibleReviews].sort((a, b) => {
      if (a.isOwn && a.status === 'pending' && !(b.isOwn && b.status === 'pending')) return -1;
      if (b.isOwn && b.status === 'pending' && !(a.isOwn && a.status === 'pending')) return 1;
      if (a.source === 'db' && b.source === 'seed') return -1;
      if (b.source === 'db' && a.source === 'seed') return 1;
      return 0;
    });
    return applyReviewOrder(base, order);
  }, [visibleReviews, order]);

  const filtered = useMemo(() => {
    if (filter === 'all') return sorted;
    return sorted.filter((r) => r.rating === filter);
  }, [sorted, filter]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = sorted.map((r) => r.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    const next = arrayMove(ids, from, to);
    // merge with any existing order so unseen ids aren't lost
    const merged = [...next, ...order.filter((id) => !next.includes(id))];
    setOrder(merged);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageReviews = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = useMemo(() => {
    const approved = visibleReviews.filter((r) => r.status === 'approved');
    const total = approved.length;
    const avg = total === 0 ? 0 : approved.reduce((s, r) => s + r.rating, 0) / total;
    const counts = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: approved.filter((r) => r.rating === star).length,
    }));
    return { total, avg: Math.round(avg * 10) / 10, counts };
  }, [visibleReviews]);

  const maxCount = Math.max(...stats.counts.map((c) => c.count), 1);

  const handleFilter = (val: number | 'all') => {
    setFilter(val);
    setPage(1);
  };

  return (
    <section id="reviews-section" className="py-14 md:py-20 bg-background">
      <div className="container">
        <div className="mb-10 md:mb-14">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
            Customer Reviews
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            See what customers around the world are saying about Parfumistry. All reviews are from verified customers.
          </p>
        </div>

        {/* Top: stats (left) + CTA box (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-10 md:mb-14">
          {/* Left: Summary */}
          <div>
            <div className="flex items-end gap-2 mb-2">
              <span className="font-display text-5xl md:text-6xl font-bold text-foreground leading-none">
                {stats.avg.toString().replace('.', ',')}
              </span>
              <span className="text-muted-foreground text-base mb-2">/ 5</span>
            </div>
            <RatingStars rating={stats.avg} size="lg" />
            <p className="text-sm text-muted-foreground mt-2 mb-5">{stats.total} reviews</p>

            <div className="space-y-2 max-w-md">
              {stats.counts.map(({ star, count }) => (
                <button
                  key={star}
                  onClick={() => handleFilter(star)}
                  className={`w-full flex items-center gap-3 text-sm group transition-opacity ${
                    filter !== 'all' && filter !== star ? 'opacity-50 hover:opacity-100' : ''
                  }`}
                >
                  <span className="text-muted-foreground w-3">{star}</span>
                  <Star className="h-3.5 w-3.5 fill-accent text-accent shrink-0" />
                  <div className="flex-1 h-2 bg-muted/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-6 text-right">{count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: CTA box */}
          <div className="relative overflow-hidden bg-gradient-to-br from-card/80 via-card/50 to-card/30 border border-border/60 rounded-2xl p-7 md:p-9 flex flex-col justify-center backdrop-blur-sm shadow-xl">
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <h3 className="font-display text-2xl md:text-3xl text-foreground mb-2">
                Share your experience
              </h3>
              {user ? (
                <Button
                  onClick={() => setSubmitOpen(true)}
                  className="rounded-full whitespace-nowrap"
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  {isAdmin ? 'Add review' : 'Leave a Review'}
                </Button>
              ) : (
                <Button
                  asChild
                  className="rounded-full whitespace-nowrap"
                  size="lg"
                >
                  <Link to="/login">
                    <LogIn className="h-4 w-4 mr-1.5" />
                    Log in to Review
                  </Link>
                </Button>
              )}
              <div className="mt-6 pt-5 border-t border-border/40">
                <p className="text-sm md:text-base text-foreground/90 leading-relaxed font-medium">
                  Once your order arrives, leave a verified review and we'll send a <span className="text-foreground font-semibold">free gift</span> with your next order. Include photos of your products and you'll earn <span className="text-foreground font-semibold">extra samples</span> too. Just message us on TikTok{' '}
                  <a
                    href="https://www.tiktok.com/@fragranceprofs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline-offset-2 hover:underline transition-colors font-semibold"
                  >
                    @fragranceprofs
                  </a>{' '}
                  with proof of your review.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Reviews list spanning full width */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <button
              onClick={() => handleFilter('all')}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider border transition-colors ${
                filter === 'all'
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'bg-transparent text-muted-foreground border-border hover:border-accent hover:text-foreground'
              }`}
            >
              All
            </button>
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() => handleFilter(star)}
                className={`px-3 py-1.5 text-xs uppercase tracking-wider border inline-flex items-center gap-1 transition-colors ${
                  filter === star
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'bg-transparent text-muted-foreground border-border hover:border-accent hover:text-foreground'
                }`}
              >
                {star}
                <Star
                  className={`h-3 w-3 ${
                    filter === star ? 'fill-accent-foreground text-accent-foreground' : 'fill-accent text-accent'
                  }`}
                />
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            {isAdmin ? 'Admin: drag the handle to reorder · ' : 'Newest first · '}
            Showing {pageReviews.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
            {(currentPage - 1) * PAGE_SIZE + pageReviews.length} of {filtered.length} reviews
          </p>

          {pageReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              No reviews match this filter.
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={pageReviews.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                <div className="divide-y divide-border">
                  {pageReviews.map((review) => (
                    <SortableReviewRow key={review.id} id={review.id} isAdmin={isAdmin}>
                      <ReviewItem review={review} isAdmin={isAdmin} onChanged={refresh} />
                    </SortableReviewRow>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-none"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-none"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <ReviewSubmitDialog open={submitOpen} onOpenChange={setSubmitOpen} onSubmitted={refresh} />
    </section>
  );
};

export default HomeReviews;
