import { useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Upload, CheckCircle, ArrowLeft, Image, X, Loader2, Shield, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const ProofUpload = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order') || '';
  const paymentMethod = searchParams.get('method') || '';
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'File too large', description: `${file.name} exceeds 10MB limit.`, variant: 'destructive' });
        continue;
      }
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid file', description: 'Please upload image files only.', variant: 'destructive' });
        continue;
      }
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }
    
    setFiles(prev => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0 || !orderNumber) return;
    setIsUploading(true);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('orderNumber', orderNumber);
        formData.append('file', file);

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-proof`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Upload failed');
        }
      }

      setIsComplete(true);
      toast({ title: 'Proof uploaded!', description: 'Your payment proof has been submitted successfully.' });
    } catch (err: any) {
      console.error('Proof upload error:', err);
      toast({ title: 'Upload failed', description: err.message || 'Could not upload proof. Please try again.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground mb-3">Proof Submitted</h1>
          <p className="text-sm text-muted-foreground mb-2">
            Your payment proof for Order <strong>#{orderNumber}</strong> has been uploaded successfully.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            We'll verify your payment and send you an order confirmation email shortly.
          </p>
          <Button asChild className="rounded-md h-12 px-8 text-xs tracking-[0.1em] uppercase">
            <Link to="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  const methodLabel = paymentMethod === 'bank_transfer' ? 'Bank Transfer' : paymentMethod === 'revolut_app' ? 'Revolut' : 'Payment';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        {/* Back link */}
        <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <FileImage className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Upload Payment Proof</h1>
          {orderNumber && (
            <p className="text-sm text-muted-foreground mt-2">
              Order <strong>#{orderNumber}</strong> · {methodLabel}
            </p>
          )}
        </div>

        {/* Warning */}
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-5 py-4 mb-6">
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
            ⏳ Please upload your proof of payment within the next <strong>3 hours</strong>. Orders without proof will be automatically cancelled.
          </p>
        </div>

        {/* Instructions */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-3.5 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground tracking-wide">What to upload</h2>
          </div>
          <div className="px-5 py-4 space-y-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Please upload a <strong className="text-foreground">screenshot or photo</strong> of your payment confirmation showing:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
              <li>The amount sent</li>
              <li>The recipient details</li>
              <li>Transaction date & status</li>
            </ul>
          </div>
        </div>

        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer p-8 text-center mb-4"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            Tap to select or drag & drop
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, or HEIC · Max 10MB per file
          </p>
        </div>

        {/* File Previews */}
        {previews.length > 0 && (
          <div className="space-y-3 mb-6">
            {previews.map((preview, i) => (
              <div key={i} className="relative rounded-lg border border-border overflow-hidden bg-card">
                <img src={preview} alt={`Proof ${i + 1}`} className="w-full h-48 object-cover" />
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="px-3 py-2 flex items-center gap-2">
                  <Image className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate">{files[i]?.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading}
          className="w-full h-[52px] rounded-lg text-sm font-semibold tracking-wide bg-green-600 hover:bg-green-700 text-white shadow-lg disabled:opacity-40"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Submit Proof ({files.length} {files.length === 1 ? 'file' : 'files'})
            </>
          )}
        </Button>

        {/* Trust badges */}
        <div className="flex flex-col items-center gap-2 pt-4 mt-4 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-accent" />
            <span className="text-[11px]">Your files are securely uploaded</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProofUpload;
