import { useCallback, useEffect, useState } from 'react';
import { Star, Check, Trash2, RefreshCw, Plus, Inbox } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { adminApproveReview, adminDeleteReview, DbReview } from '@/hooks/useReviews';
import { toast } from '@/hooks/use-toast';
import { ReviewSubmitDialog } from '@/components/reviews/ReviewSubmitDialog';

const RatingStars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${i <= rating ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`}
      />
    ))}
  </div>
);

const ReviewsAdmin = () => {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [reviews, setReviews] = useState<DbReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setReviews(data as DbReview[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filtered = reviews.filter((r) => (filter === 'all' ? true : r.status === filter));

  const handleApprove = async (id: string) => {
    const res = await adminApproveReview(id);
    if (res.error) {
      toast({ title: 'Approve failed', description: res.error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Review approved' });
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return;
    const res = await adminDeleteReview(id);
    if (res.error) {
      toast({ title: 'Delete failed', description: res.error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Review deleted' });
    fetchAll();
  };

  const handleDeleteAllPending = async () => {
    const pending = reviews.filter((r) => r.status === 'pending');
    if (pending.length === 0) {
      toast({ title: 'No pending reviews to delete' });
      return;
    }
    if (!confirm(`Delete all ${pending.length} pending review(s) permanently?`)) return;
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('status', 'pending');
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: `Deleted ${pending.length} pending review(s)` });
    fetchAll();
  };

  const pendingCount = reviews.filter((r) => r.status === 'pending').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Customer Reviews</h2>
          <p className="text-xs text-muted-foreground">
            {pendingCount} pending · {reviews.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDeleteAllPending} disabled={pendingCount === 0}>
            <Trash2 className="h-4 w-4 mr-1.5" /> Delete all pending
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add review
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {(['pending', 'approved', 'all'] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center bg-amber-500 text-white text-[10px] rounded-full w-4 h-4">
                {pendingCount}
              </span>
            )}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed rounded">
          <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No {filter === 'all' ? '' : filter} reviews</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="border rounded p-4 bg-card"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <RatingStars rating={r.rating} />
                  <span
                    className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                      r.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-emerald-500/10 text-emerald-500'
                    }`}
                  >
                    {r.status}
                  </span>
                  {r.is_admin_added && (
                    <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm">
                      Admin-added
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(r.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <p className={`text-sm mb-2 ${r.text ? '' : 'italic text-muted-foreground'}`}>
                {r.text || 'Rating submitted - no written feedback'}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <span className="text-foreground/80">{r.customer_name}</span>
              </div>
              <div className="flex gap-2">
                {r.status === 'pending' && (
                  <Button size="sm" onClick={() => handleApprove(r.id)}>
                    <Check className="h-4 w-4 mr-1.5" /> Approve
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => handleDelete(r.id)}>
                  <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReviewSubmitDialog open={addOpen} onOpenChange={setAddOpen} onSubmitted={fetchAll} />
    </div>
  );
};

export default ReviewsAdmin;
