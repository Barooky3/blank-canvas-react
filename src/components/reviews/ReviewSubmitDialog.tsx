import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ImagePlus, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { submitReview, adminAddReview, ADMIN_EMAIL } from '@/hooks/useReviews';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReviewSubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
}

const MAX_IMAGES = 4;
const MAX_SIZE_MB = 5;

export const ReviewSubmitDialog = ({ open, onOpenChange, onSubmitted }: ReviewSubmitDialogProps) => {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign in to write a review</DialogTitle>
            <DialogDescription>
              You need a Parfumistry account to leave a review. It only takes a moment.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-2">
            <Button asChild className="rounded-none" onClick={() => onOpenChange(false)}>
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-none" onClick={() => onOpenChange(false)}>
              <Link to="/signup">Create account</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const displayName =
    name.trim() ||
    (user.user_metadata?.full_name as string | undefined) ||
    (user.email ? user.email.split('@')[0] : 'Anonymous');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast({ title: `You can attach up to ${MAX_IMAGES} images.`, variant: 'destructive' });
      return;
    }
    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of toUpload) {
      if (!file.type.startsWith('image/')) {
        toast({ title: `${file.name} is not an image`, variant: 'destructive' });
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast({ title: `${file.name} exceeds ${MAX_SIZE_MB}MB`, variant: 'destructive' });
        continue;
      }
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from('review-images')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (error) {
        toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
        continue;
      }
      const { data: pub } = supabase.storage.from('review-images').getPublicUrl(path);
      newUrls.push(pub.publicUrl);
    }
    setImages((prev) => [...prev, ...newUrls]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((u) => u !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;
    if (!text.trim() && rating < 4) {
      toast({ title: 'Please add a short note for ratings under 4 stars.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const res = isAdmin
      ? await adminAddReview({ customer_name: displayName, rating, text, images })
      : await submitReview({
          user_id: user.id,
          customer_name: displayName,
          customer_email: user.email || '',
          rating,
          text,
          images,
        });
    setSubmitting(false);
    if (res.error) {
      toast({ title: 'Could not submit review', description: res.error.message, variant: 'destructive' });
      return;
    }
    toast({
      title: isAdmin ? 'Review published' : 'Thanks for your review!',
      description: isAdmin
        ? 'Your review is now live.'
        : 'It will appear publicly once approved. You can still see it while logged in.',
    });
    setText('');
    setName('');
    setRating(5);
    setImages([]);
    onOpenChange(false);
    onSubmitted?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border/60">
        <DialogHeader className="space-y-2">
          <DialogTitle className="font-display text-2xl text-foreground">
            {isAdmin ? 'Add a review' : 'Write a Review'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {isAdmin
              ? 'Admin-added reviews are published immediately.'
              : 'Share your honest experience — reviews are checked before going live, usually within 24 hours. Add photos to qualify for extra samples on your next order.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Rating */}
          <div className="rounded-lg border border-border/50 bg-background/40 p-4">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 block">
              Your rating
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHoverRating(i)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(i)}
                  className="p-0.5 transition-transform hover:scale-110"
                  aria-label={`${i} star${i > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      i <= (hoverRating || rating)
                        ? 'fill-accent text-accent'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Display name */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 block">
              Display name {isAdmin ? '' : '(optional)'}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=""
              maxLength={80}
              className="rounded-none bg-background/40 border-border/60 focus-visible:border-accent"
              required={isAdmin}
            />
            {!isAdmin && (
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Leave blank to appear as “Anonymous”.
              </p>
            )}
          </div>

          {/* Review text */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 block">
              Your review
            </label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your experience with Parfumistry..."
              rows={5}
              maxLength={1000}
              className="rounded-none resize-none bg-background/40 border-border/60 focus-visible:border-accent"
            />
            <p className="text-[11px] text-muted-foreground mt-1 text-right">{text.length}/1000</p>
          </div>

          {/* Image upload */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 block">
              Add photos <span className="text-muted-foreground/60 normal-case tracking-normal">(optional, up to {MAX_IMAGES})</span>
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-2">
                {images.map((url) => (
                  <div key={url} className="relative aspect-square group">
                    <img
                      src={url}
                      alt="Review attachment"
                      className="w-full h-full object-cover rounded border border-border/60"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm border border-border/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                      aria-label="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-border/60 hover:border-accent hover:bg-accent/5 transition-colors py-4 text-sm text-muted-foreground hover:text-accent disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <ImagePlus className="h-4 w-4" /> Click to add photos
                  </>
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Max {MAX_SIZE_MB}MB each. JPG, PNG or WebP.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              className="rounded-none"
              onClick={() => onOpenChange(false)}
              disabled={submitting || uploading}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-none" disabled={submitting || uploading}>
              {submitting ? 'Submitting...' : isAdmin ? 'Publish' : 'Submit review'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
