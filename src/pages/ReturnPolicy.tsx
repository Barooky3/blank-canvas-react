import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Package, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

const ReturnPolicy = () => {
  return (
    <div className="min-h-screen py-20 md:py-28 bg-background">
      <div className="container max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">Return & Refund Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: March 2026</p>

        <div className="space-y-8">
          {/* 30-Day Return Window */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-3 mb-4">
              <Clock className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">30-Day Return Window</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  You have <strong className="text-foreground">30 days from the date you receive your product</strong> to request a return or refund. After this period, we are unable to process return requests.
                </p>
              </div>
            </div>
          </div>

          {/* Eligibility */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-3 mb-4">
              <Package className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">Return Eligibility</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  To be eligible for a return, the following conditions must be met:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Less than 5ml used (~50 sprays)</strong> — The product must have been minimally used, with less than 5ml (approximately 50 sprays) of the fragrance consumed. Products that have been significantly used are not eligible for a return.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Within 30 days</strong> — The return request must be submitted within 30 days of receiving your order.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Original packaging</strong> — The product should be returned in its original packaging where possible.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Damaged Items */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">Damaged or Incorrect Items</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  If your order arrives <strong className="text-foreground">damaged, defective, or incorrect</strong>, we will issue a <strong className="text-foreground">full refund or send a replacement</strong> as soon as proof is provided. Simply send us a photo or video of the issue and we'll take care of the rest — no need to return the damaged item.
                </p>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3.5 py-2.5">
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    <strong>How to report:</strong> Contact us on{' '}
                    <a href="https://www.tiktok.com/@fragranceprofs" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">TikTok @fragranceprofs</a>{' '}
                    with your order number and photos/videos of the damage. We aim to resolve all claims within 48 hours.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Refund Process */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-3 mb-4">
              <Shield className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">Refund Process</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Once your return is received and inspected, or once proof of damage is verified, we will notify you of the approval or rejection of your refund. Approved refunds will be processed back to your original payment method within <strong className="text-foreground">1–2 business days</strong>.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">We cover return shipping costs</strong> — you will not be charged for shipping when returning an eligible product. We will provide you with a prepaid return label or reimburse your shipping costs.
                </p>
              </div>
            </div>
          </div>

          {/* Non-Returnable */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">Non-Returnable Items</h2>
                <ul className="space-y-2">
                  <li className="text-sm text-muted-foreground">• Products with more than 5ml used</li>
                  <li className="text-sm text-muted-foreground">• Return requests made after 30 days of receipt</li>
                  <li className="text-sm text-muted-foreground">• Products damaged due to customer mishandling</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Questions about our return policy?{' '}
              <a href="https://www.tiktok.com/@fragranceprofs" target="_blank" rel="noopener noreferrer" className="text-accent font-medium hover:underline">
                Contact us on TikTok
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnPolicy;
