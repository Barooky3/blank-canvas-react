import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, PackageSearch } from "lucide-react";
import { toast } from "sonner";

interface LookupResult {
  matched: boolean;
  order?: { order_number: number; status: string; created_at: string };
}

const HomeTrackOrder = () => {
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanNumber = orderNumber.trim().replace(/^#/, "");
    if (!cleanEmail || !cleanNumber) {
      toast.error("Please enter both your email and order number.");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("track-order", {
        body: { email: cleanEmail, orderNumber: cleanNumber, skipHistory: true },
      });
      if (error) throw error;
      setResult(data as LookupResult);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-14 md:py-20 bg-background">
      <div className="container">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <PackageSearch className="w-8 h-8 mx-auto mb-3 text-accent" />
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl text-foreground mb-3">
              Track Your Order
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter the email and order number used at checkout. Both must match.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-card border border-border rounded-lg p-6 space-y-5 shadow-sm"
          >
            <div className="space-y-2">
              <Label htmlFor="home-track-email">Email address</Label>
              <Input
                id="home-track-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="home-track-number">Order number</Label>
              <Input
                id="home-track-number"
                type="text"
                inputMode="numeric"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. 1042"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-[11px] font-medium tracking-[0.12em] uppercase bg-accent text-accent-foreground hover:bg-accent/90 rounded-none"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking…
                </>
              ) : (
                "Track order"
              )}
            </Button>
          </form>

          {result && (
            <div className="mt-6">
              {result.matched ? (
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-5 text-sm text-foreground">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">
                        Order #{result.order?.order_number} found
                      </p>
                      <p className="text-muted-foreground">
                        Your tracking number will automatically be sent to your
                        email when it's ready, and you can come back here to see
                        details when it happens.
                      </p>
                      {result.order?.status && (
                        <p className="text-xs mt-3 uppercase tracking-wider text-muted-foreground">
                          Current status:{" "}
                          <span className="text-foreground font-medium">
                            {result.order.status}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-5 text-sm">
                  <p className="font-medium text-foreground mb-1">
                    No matching order found
                  </p>
                  <p className="text-muted-foreground">
                    The email and order number you entered don't match any order
                    in our system. Please double-check both and try again.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomeTrackOrder;
