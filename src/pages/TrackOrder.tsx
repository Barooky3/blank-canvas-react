import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Loader2, Mail, PackageSearch } from "lucide-react";
import { toast } from "sonner";

const ADMIN_EMAILS = ["ewhz3384@gmail.com", "mirzau2017@gmail.com"];

interface LookupResult {
  matched: boolean;
  order?: { order_number: number; status: string; created_at: string };
}

interface HistoryRow {
  id: string;
  email: string;
  order_number: number;
  matched: boolean;
  created_at: string;
}

const TrackOrder = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);

  const isAdminViewer = !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = async () => {
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from("tracking_lookups")
      .select("id, email, order_number, matched, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error("Could not load history");
    } else {
      setHistory((data || []) as HistoryRow[]);
    }
    setHistoryLoading(false);
  };

  useEffect(() => {
    if (isAdminViewer && historyOpen && history.length === 0) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminViewer, historyOpen]);

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
        body: { email: cleanEmail, orderNumber: cleanNumber },
      });
      if (error) throw error;
      setResult(data as LookupResult);
      if (isAdminViewer && historyOpen) loadHistory();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>


      <main className="min-h-screen bg-background py-16 px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <PackageSearch className="w-10 h-10 mx-auto mb-3 text-accent" />
            <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-3">
              Track Your Order
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter the email and order number used at checkout. Both must match.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-card border border-border rounded-lg p-6 space-y-5 shadow-sm"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Order number</Label>
              <Input
                id="orderNumber"
                type="text"
                inputMode="numeric"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. 1042"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
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

          {isAdminViewer && (
            <div className="mt-10">
              <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    type="button"
                  >
                    <span>Lookup history (admin only)</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        historyOpen ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="bg-card border border-border rounded-lg overflow-hidden">
                    {historyLoading ? (
                      <div className="p-6 text-center text-muted-foreground text-sm">
                        <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                      </div>
                    ) : history.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground text-sm">
                        No lookups yet.
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                            <tr>
                              <th className="text-left px-3 py-2 font-medium">
                                When
                              </th>
                              <th className="text-left px-3 py-2 font-medium">
                                Email
                              </th>
                              <th className="text-left px-3 py-2 font-medium">
                                Order #
                              </th>
                              <th className="text-left px-3 py-2 font-medium">
                                Match
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {history.map((row) => (
                              <tr
                                key={row.id}
                                className="border-t border-border"
                              >
                                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                                  {new Date(row.created_at).toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-foreground break-all">
                                  {row.email}
                                </td>
                                <td className="px-3 py-2 text-foreground">
                                  #{row.order_number}
                                </td>
                                <td className="px-3 py-2">
                                  {row.matched ? (
                                    <span className="text-green-600 dark:text-green-400">
                                      yes
                                    </span>
                                  ) : (
                                    <span className="text-destructive">no</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default TrackOrder;
