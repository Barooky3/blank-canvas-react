import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, LogOut, Package, Loader2, ExternalLink, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  checkout_reference: string;
  status: string;
  total_amount: number;
  order_items: OrderItem[];
  created_at: string;
  order_number: number | null;
  rejection_notes: string | null;
}

const parseValueMismatch = (notes: string | null) => {
  if (!notes) return null;
  const match = notes.match(/Code value:\s*(.+?)\s*\|\s*Cart value:\s*€([\d.]+)\s*\|\s*Missing:\s*€([\d.]+)/);
  if (!match) return null;
  return { codeValue: match[1], cartValue: match[2], missingAmount: match[3] };
};

const ADMIN_EMAILS = ['ewhz3384@gmail.com'];

const Account = () => {
  const { user, loading, signOut } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-user-orders');
      if (!error && data?.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  if (loading || !user) return null;

  const displayName = user.user_metadata?.full_name || 'My Account';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      case 'pending': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-muted-foreground bg-secondary border-border';
    }
  };

  return (
    <div className="min-h-screen py-20 md:py-28 bg-background">
      <div className="container max-w-2xl">
        {/* Account Header */}
        <div className="flex items-center gap-5 py-8 border-b border-border">
          <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <User className="h-10 w-10 text-muted-foreground" strokeWidth={1} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl md:text-3xl text-foreground">{displayName}</h1>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            {ADMIN_EMAILS.includes(user.email || '') && (
              <Button
                variant="link"
                className="p-0 h-auto text-accent text-xs mt-1 flex items-center gap-1"
                asChild
              >
                <Link to="/admin/orders">
                  <ExternalLink className="h-3 w-3" />
                  Admin Orders Dashboard
                </Link>
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            className="rounded-none text-xs font-medium tracking-[0.1em] uppercase gap-2 shrink-0"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Purchase History */}
        <div className="pt-10">
          <div className="flex items-center gap-3 mb-6">
            <Package className="h-5 w-5 text-foreground" strokeWidth={1.5} />
            <h2 className="text-lg font-medium text-foreground">Purchase History</h2>
          </div>

          {ordersLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-secondary/50 border border-border p-12 flex flex-col items-center justify-center text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" strokeWidth={1} />
              <p className="text-muted-foreground mb-6">No purchases yet</p>
              <Button asChild className="rounded-none text-xs font-medium tracking-[0.15em] uppercase">
                <Link to="/shop">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const items = Array.isArray(order.order_items) ? order.order_items : [];
                const mismatchData = parseValueMismatch(order.rejection_notes);
                return (
                  <OrderCard
                    key={order.id}
                    order={order}
                    items={items}
                    mismatchData={mismatchData}
                    formatPrice={formatPrice}
                    statusColor={statusColor}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface OrderCardProps {
  order: Order;
  items: OrderItem[];
  mismatchData: ReturnType<typeof parseValueMismatch>;
  formatPrice: (price: number) => string;
  statusColor: (status: string) => string;
}

const OrderCard = ({ order, items, mismatchData, formatPrice, statusColor }: OrderCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const isRejected = order.status === 'rejected';
  const isApproved = order.status === 'approved';
  const isValueMismatch = !!mismatchData;
  const hasRejectionInfo = isRejected && order.rejection_notes;

  return (
    <div className="border border-border bg-background p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-foreground font-mono font-semibold">
            Order #{order.order_number || '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(order.created_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
          </p>
        </div>
        <span className={`text-[10px] font-semibold tracking-[0.1em] uppercase px-2.5 py-1 border rounded-sm ${statusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      <div className="space-y-1.5 mb-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-foreground">{item.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
            <span className="text-foreground font-medium">{formatPrice(item.price)}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-[0.1em]">Total</span>
        <span className="text-sm font-semibold text-foreground">{formatPrice(order.total_amount)}</span>
      </div>

      {isApproved && (
        <div className="mt-3 flex items-start gap-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-lg p-3">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
          <div className="text-xs text-green-800 dark:text-green-300">
            <p className="font-semibold">Order Approved</p>
            <p className="mt-0.5">Check your email for the order confirmation with full details.</p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="mt-3">
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1 text-xs text-red-800 dark:text-red-300">
                <p className="font-semibold">Order Rejected</p>
                <p className="mt-0.5">
                  {isValueMismatch
                    ? 'The gift card value did not match your cart total.'
                    : (order.rejection_notes?.trim() || 'Your payment could not be verified. Please try again or contact us.')}
                </p>
              </div>
            </div>

            {hasRejectionInfo && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="mt-2 flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400 hover:underline w-full"
              >
                <Mail className="h-3.5 w-3.5" />
                {showDetails ? 'Hide' : 'View'} rejection details
                {showDetails ? <ChevronUp className="h-3.5 w-3.5 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
              </button>
            )}
          </div>

          {showDetails && hasRejectionInfo && (
            <div className="mt-2 border border-border rounded-lg p-4 bg-muted/30 space-y-3">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email you received:
              </p>

              {isValueMismatch && mismatchData ? (
                <>
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg p-3">
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-amber-700 dark:text-amber-400">Code value:</span>
                        <span className="font-semibold text-amber-900 dark:text-amber-200">{mismatchData.codeValue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-700 dark:text-amber-400">Cart value:</span>
                        <span className="font-semibold text-amber-900 dark:text-amber-200">€{mismatchData.cartValue}</span>
                      </div>
                      <div className="h-px bg-amber-300 dark:bg-amber-700 my-1" />
                      <div className="flex justify-between">
                        <span className="text-amber-700 dark:text-amber-400 font-medium">Missing:</span>
                        <span className="font-bold text-red-600 dark:text-red-400">€{mismatchData.missingAmount}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-2">
                    <p className="font-semibold text-foreground">How to redo your order:</p>
                    <p><strong className="text-foreground">1.</strong> Buy a new gift card to cover the missing amount (€{mismatchData.missingAmount}).</p>
                    <p><strong className="text-foreground">2.</strong> Add the same items to your cart again.</p>
                    <p><strong className="text-foreground">3.</strong> Enter both codes at checkout — the original one plus the new one.</p>
                    <p><strong className="text-foreground">4.</strong> Submit your new order and we'll verify both codes.</p>
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {order.rejection_notes}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Account;
