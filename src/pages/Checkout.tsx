import { useState, useRef, useEffect } from 'react';
import { getFirstVisitAt } from '@/utils/firstVisit';
import PaymentMethodExplainer from '@/components/PaymentMethodExplainer';
import { DeliveryInfo } from '@/components/product/DeliveryInfo';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ShoppingBag, Tag, Loader2, Shield, Lock, Mail, AlertCircle, Maximize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronsUpDown, Check, Gift, X } from 'lucide-react';
import { getFragrances } from '@/data/products';
import { useBannedStatus } from '@/hooks/useBannedStatus';
import { useAuth } from '@/contexts/AuthContext';


const COUNTRIES = [
  'Netherlands', 'Belgium', 'Germany', 'France', 'United Kingdom', 'Spain', 'Italy',
  'Austria', 'Switzerland', 'Portugal', 'Poland', 'Sweden', 'Denmark', 'Norway', 'Finland',
  'Ireland', 'Luxembourg', 'Czech Republic', 'Greece', 'Hungary', 'Romania', 'Bulgaria',
  'Croatia', 'Slovakia', 'Slovenia', 'Serbia', 'Estonia', 'Latvia', 'Lithuania', 'Iceland',
  'Turkey', 'Russia', 'Ukraine', 'Bosnia and Herzegovina', 'Montenegro', 'North Macedonia',
  'Albania', 'Moldova', 'Cyprus', 'Malta', 'Monaco', 'Liechtenstein', 'Andorra', 'Kosovo',
  'Belarus', 'Georgia', 'Armenia', 'Azerbaijan', 'San Marino', 'Kazakhstan',
  'United States', 'Canada', 'Mexico',
  'Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Ecuador', 'Uruguay', 'Paraguay', 'Bolivia', 'Venezuela',
  'Dominican Republic', 'Jamaica', 'Trinidad and Tobago', 'Barbados', 'Curaçao', 'Suriname',
  'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Israel', 'Jordan', 'Lebanon', 'Iraq',
  'Japan', 'South Korea', 'China', 'India', 'Thailand', 'Vietnam', 'Indonesia', 'Malaysia', 'Singapore',
  'Philippines', 'Hong Kong', 'Taiwan', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Cambodia', 'Myanmar', 'Macao',
  'Australia', 'New Zealand', 'Fiji',
  'South Africa', 'Egypt', 'Morocco', 'Nigeria', 'Kenya', 'Ghana', 'Tunisia', 'Algeria', 'Senegal',
  'Ivory Coast', 'Cameroon', 'Tanzania', 'Ethiopia', 'Mauritius', 'Zimbabwe',
].sort();

const EU_UK_COUNTRIES = new Set([
  'Netherlands', 'Belgium', 'Germany', 'France', 'United Kingdom', 'Spain', 'Italy',
  'Austria', 'Switzerland', 'Portugal', 'Poland', 'Sweden', 'Denmark', 'Norway', 'Finland',
  'Ireland', 'Luxembourg', 'Czech Republic', 'Greece', 'Hungary', 'Romania', 'Bulgaria',
  'Croatia', 'Slovakia', 'Slovenia', 'Estonia', 'Latvia', 'Lithuania', 'Iceland', 'Cyprus',
  'Malta', 'Monaco', 'Liechtenstein', 'Andorra', 'San Marino',
]);

type ShippingMethod = 'standard' | 'express';

const getShippingCost = (country: string, method: ShippingMethod = 'standard'): number => {
  if (!country) return 0;
  if (method === 'express') return 12.99;
  return 3.99;
};

// Discount code validation is performed server-side via the
// `validate-discount` edge function — codes are never embedded in client code.

const CountryCombobox = ({ value, onSelect }: { value: string; onSelect: (value: string) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full h-11 justify-between bg-background border-border rounded-md font-normal text-sm">
          {value || "Select country"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((country) => (
                <CommandItem key={country} value={country} onSelect={() => { onSelect(country); setOpen(false); }}>
                  <Check className={cn("mr-2 h-4 w-4", value === country ? "opacity-100" : "opacity-0")} />
                  {country}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const Checkout = () => {
  const { items, totalPrice, subtotalBeforeDiscount, freeItemDiscount, freeItemsCount, clearCart } = useCart();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isBanned } = useBannedStatus();
  const { user } = useAuth();
  const showBancontact = (user?.email || '').toLowerCase() === 'elkhabirmalik@gmail.com';


  const [isCompleted, setIsCompleted] = useState(false);
  const [completedPaymentMethod, setCompletedPaymentMethod] = useState('');
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [freeSample, setFreeSample] = useState<{ id: string; name: string; brand: string; image: string } | null>(() => {
    const saved = sessionStorage.getItem('checkoutFreeSample');
    if (saved) { try { return JSON.parse(saved); } catch {} }
    return null;
  });
  const [sampleOpen, setSampleOpen] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>(() => {
    const saved = sessionStorage.getItem('checkoutShippingMethod');
    return (saved === 'express' ? 'express' : 'standard') as ShippingMethod;
  });
  useEffect(() => { sessionStorage.setItem('checkoutShippingMethod', shippingMethod); }, [shippingMethod]);

  const sampleOptions = getFragrances();

  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem('checkoutFormData');
    if (saved) { try { return JSON.parse(saved); } catch {} }
    return { email: '', confirmEmail: '', firstName: '', lastName: '', country: '', streetAddress: '', postalCode: '', city: '' };
  });

  useEffect(() => { sessionStorage.setItem('checkoutFormData', JSON.stringify(formData)); }, [formData]);
  useEffect(() => {
    if (freeSample) sessionStorage.setItem('checkoutFreeSample', JSON.stringify(freeSample));
    else sessionStorage.removeItem('checkoutFreeSample');
  }, [freeSample]);

  useEffect(() => {
    const completed = searchParams.get('completed');
    const orderNum = searchParams.get('order');
    if (completed) { setCompletedPaymentMethod(completed); setCompletedOrderNumber(orderNum); setIsCompleted(true); }
  }, [searchParams]);

  const rewarbleVideoRef = useRef<HTMLVideoElement>(null);
  const handleRewarbleFullscreen = () => {
    const v = rewarbleVideoRef.current as any;
    if (!v) return;
    try {
      if (v.webkitEnterFullscreen) { v.webkitEnterFullscreen(); return; }
      if (v.requestFullscreen) { v.requestFullscreen(); return; }
      if (v.webkitRequestFullscreen) { v.webkitRequestFullscreen(); return; }
      if (v.msRequestFullscreen) { v.msRequestFullscreen(); return; }
    } catch {}
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'email' && value.includes('@')) {
      localStorage.setItem('pp_customer_email', value.toLowerCase().trim());
    }
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isFormValid = () => {
    return formData.email && isValidEmail(formData.email) && formData.confirmEmail && formData.email === formData.confirmEmail &&
           formData.firstName && formData.lastName && formData.country && formData.streetAddress && formData.postalCode && formData.city;
  };

  const isAddressComplete = () => {
    return formData.country && formData.streetAddress && formData.postalCode && formData.city;
  };

  const handleApplyDiscount = async () => {
    setIsApplyingDiscount(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-discount', {
        body: { code: discountCode.trim() },
      });
      const result = data as { valid?: boolean; percent?: number } | null;
      if (!error && result?.valid && result.percent) {
        setAppliedDiscount({ code: discountCode.trim(), percent: result.percent });
        toast({ title: 'Discount applied!', description: `${result.percent}% off has been applied to your order.` });
      } else {
        setAppliedDiscount(null);
        toast({ title: 'Invalid code', description: 'This discount code is not valid.', variant: 'destructive' });
      }
    } catch {
      setAppliedDiscount(null);
      toast({ title: 'Invalid code', description: 'This discount code is not valid.', variant: 'destructive' });
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const formDataRef = useRef(formData);
  formDataRef.current = formData;
  const appliedDiscountRef = useRef(appliedDiscount);
  appliedDiscountRef.current = appliedDiscount;

  const shippingCost = formData.country ? getShippingCost(formData.country, shippingMethod) : 0;
  const currentTotal = (appliedDiscount ? totalPrice * (1 - appliedDiscount.percent / 100) : totalPrice) + shippingCost;

  const buildOrderContext = () => {
    const fd = formDataRef.current;
    const cartItems = items.map(item => ({
      name: item.product.name, brand: item.product.brand,
      image: item.product.bundleImages?.[1] || item.product.image,
      price: item.selectedPrice || item.product.price,
      quantity: item.quantity, selectedMl: item.selectedMl,
      affiliateUrl: item.product.affiliateUrl,
    }));
    if (freeSample) {
      cartItems.push({
        name: `${freeSample.name} — Free 2ml Sample 🎁`,
        brand: freeSample.brand,
        image: freeSample.image,
        price: 0,
        quantity: 1,
        selectedMl: 2,
        affiliateUrl: '',
      });
    }
    const finalTotal = (appliedDiscountRef.current ? totalPrice * (1 - appliedDiscountRef.current.percent / 100) : totalPrice) + getShippingCost(fd.country, shippingMethod);
    const ctxPayload = JSON.stringify({
      cartItems, email: fd.email,
      customerName: `${fd.firstName} ${fd.lastName}`,
      shippingAddress: { country: fd.country, city: fd.city, postalCode: fd.postalCode, line1: fd.streetAddress },
      totalAmount: finalTotal.toFixed(2),
      discountCode: appliedDiscountRef.current?.code || null,
      discountPercent: appliedDiscountRef.current?.percent || 0,
      shippingMethod,
      shippingCost: getShippingCost(fd.country, shippingMethod),
    });
    sessionStorage.setItem('checkoutOrderContext', ctxPayload);
    try { localStorage.setItem('checkoutOrderContext', ctxPayload); } catch {}
    return finalTotal;
  };

  const handlePayment = (route: string) => {
    if (!isFormValid()) {
      toast({ title: 'Please fill in all fields', description: 'Complete your shipping information before paying.', variant: 'destructive' });
      return;
    }
    const finalTotal = buildOrderContext();
    navigate(`/${route}?total=${finalTotal.toFixed(2)}`);
  };

  const handleCashOnDelivery = async () => {
    if (!isFormValid()) {
      toast({ title: 'Please fill in all fields', description: 'Complete your shipping information before paying.', variant: 'destructive' });
      return;
    }
    if (formData.country.trim().toLowerCase() !== 'ireland') {
      toast({ title: 'Not available in your country', description: 'Cash on Delivery is only available in Ireland — that\'s where our company is located.', variant: 'destructive' });
      return;
    }
    if (formData.city.trim().toLowerCase() !== 'portlaoise') {
      toast({ title: 'Not available in your city', description: 'Cash on Delivery is only available in Portlaoise, Ireland — that\'s where our company is located.', variant: 'destructive' });
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      buildOrderContext();
      const ctx = JSON.parse(sessionStorage.getItem('checkoutOrderContext') || '{}');
      const { data } = await supabase.functions.invoke('request-order-approval', {
        body: {
          orderItems: ctx.cartItems,
          customerEmail: ctx.email,
          customerName: ctx.customerName,
          shippingAddress: { ...ctx.shippingAddress, shippingMethod: ctx.shippingMethod || "standard" },
          totalAmount: ctx.totalAmount,
          paymentMethod: 'cod',
          giftCardCode: 'CASH ON DELIVERY — Portlaoise, Ireland',
          discountCode: ctx.discountCode || null,
          discountPercent: ctx.discountPercent || 0,
          idempotencyKey: crypto.randomUUID(),
          firstVisitAt: getFirstVisitAt(),
        },
      });
      clearCart();
      sessionStorage.removeItem('checkoutOrderContext');
      try { localStorage.removeItem('checkoutOrderContext'); } catch {}
      sessionStorage.removeItem('checkoutFormData');
      sessionStorage.removeItem('checkoutFreeSample');
      setFreeSample(null);
      const orderNum = data?.orderNumber ? `&order=${data.orderNumber}` : '';
      navigate(`/checkout?completed=cod${orderNum}`);
    } catch (err) {
      console.error('COD order error:', err);
      toast({ title: 'Order error', description: 'Could not complete your order. Please try again.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && !isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center py-16 bg-background">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" strokeWidth={1} />
          <h1 className="font-display text-2xl text-foreground mb-3">{t('checkout.emptyCart')}</h1>
          <p className="text-sm text-muted-foreground mb-8">{t('checkout.emptyCartDesc')}</p>
          <Button asChild className="rounded-none h-12 px-8 text-xs tracking-[0.1em] uppercase">
            <Link to="/shop">{t('checkout.continueShopping')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center py-16 bg-muted/30">
        <div className="bg-background rounded-2xl shadow-lg max-w-md w-full mx-4 p-8 md:p-10">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-accent/15 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-accent" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="font-display text-3xl text-foreground text-center mb-4">{t('checkout.thankYou')}</h1>
          {completedOrderNumber && (
            <p className="text-center text-sm font-mono font-semibold text-accent mb-4">Order #{completedOrderNumber}</p>
          )}
          <p className="text-muted-foreground text-center mb-2">
            Your order has been received. You will receive the order confirmation email as soon as the code is verified.
          </p>
          <p className="text-sm text-muted-foreground text-center mb-8">
            This usually takes a short while. Thank you for your patience.
          </p>

          <div className="border border-accent/30 bg-accent/5 rounded-xl p-5 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-accent" strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground mb-2">
                  Check your email after approval
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Once your order has been <strong className="text-foreground">approved</strong>, your confirmation and order details will be sent to <strong className="text-foreground">your inbox</strong>. Approval can be <strong className="text-foreground">instant</strong> or take up to a <strong className="text-foreground">few hours</strong>.
                </p>
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                  <span>Don't see it? Please check your <strong className="text-foreground">spam</strong> or <strong className="text-foreground">promotions</strong> folder.</span>
                </p>
              </div>
            </div>
          </div>

          <Button asChild className="w-full rounded-md h-12 text-xs tracking-[0.15em] uppercase font-semibold">
            <Link to="/shop">{t('checkout.continueShopping')}</Link>
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg py-8 md:py-12 px-4">
        {/* Secure checkout header */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Lock className="h-4 w-4 text-accent" />
          <h1 className="font-display text-2xl text-foreground">{t('checkout.title')}</h1>
        </div>




        {isBanned && (
          <div className="mb-6 rounded-md border border-destructive/40 bg-destructive/10 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-destructive">Checkout disabled — account banned</p>
              <p className="text-foreground/80 mt-1">
                Your account has been banned for abuse. You cannot place an order while signed in
                to this account. All fields below are disabled.
              </p>
            </div>
          </div>
        )}

        <fieldset disabled={isBanned} className="contents [&:disabled_*]:cursor-not-allowed">
        {/* Form fields */}
        <div className={cn("space-y-4 mb-6", isBanned && "opacity-60 pointer-events-none select-none")}>

          <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">Your details</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">First name *</Label>
              <Input value={formData.firstName} onChange={(e) => updateFormData('firstName', e.target.value)} placeholder="John" className="h-11 bg-background" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Last name *</Label>
              <Input value={formData.lastName} onChange={(e) => updateFormData('lastName', e.target.value)} placeholder="Doe" className="h-11 bg-background" />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Email *</Label>
            <Input type="email" value={formData.email} onChange={(e) => updateFormData('email', e.target.value)} placeholder="you@example.com" className="h-11 bg-background" />
            <p className="text-[10px] text-muted-foreground mt-1">{t('checkout.emailHelper')}</p>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Confirm email *</Label>
            <Input type="email" value={formData.confirmEmail} onChange={(e) => updateFormData('confirmEmail', e.target.value)} placeholder="Confirm your email"
              className={cn("h-11 bg-background", formData.confirmEmail && formData.confirmEmail !== formData.email && "border-destructive")}
            />
            {formData.confirmEmail && formData.confirmEmail !== formData.email && (
              <p className="text-[10px] text-destructive mt-1">Emails do not match</p>
            )}
          </div>

          <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground pt-2">Shipping address</h2>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Country *</Label>
            <CountryCombobox value={formData.country} onSelect={(value) => updateFormData('country', value)} />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Street address *</Label>
            <Input value={formData.streetAddress} onChange={(e) => updateFormData('streetAddress', e.target.value)} placeholder="123 Main Street" className="h-11 bg-background" />
          </div>

          {(() => {
            const c = formData.country;
            const locale: Record<string, { postalLabel: string; postalPlaceholder: string; cityLabel: string; cityPlaceholder: string }> = {
              'Ireland': { postalLabel: 'Eircode *', postalPlaceholder: 'D02 XY45', cityLabel: 'County *', cityPlaceholder: 'Dublin' },
              'United Kingdom': { postalLabel: 'Postcode *', postalPlaceholder: 'SW1A 1AA', cityLabel: 'Town/City *', cityPlaceholder: 'London' },
              'United States': { postalLabel: 'ZIP code *', postalPlaceholder: '10001', cityLabel: 'City *', cityPlaceholder: 'New York' },
              'Canada': { postalLabel: 'Postal code *', postalPlaceholder: 'K1A 0B1', cityLabel: 'City/Province *', cityPlaceholder: 'Toronto' },
              'Germany': { postalLabel: 'PLZ *', postalPlaceholder: '10115', cityLabel: 'Stadt *', cityPlaceholder: 'Berlin' },
              'Italy': { postalLabel: 'CAP *', postalPlaceholder: '00100', cityLabel: 'Città *', cityPlaceholder: 'Roma' },
              'Spain': { postalLabel: 'Código postal *', postalPlaceholder: '28001', cityLabel: 'Ciudad *', cityPlaceholder: 'Madrid' },
              'France': { postalLabel: 'Code postal *', postalPlaceholder: '75001', cityLabel: 'Ville *', cityPlaceholder: 'Paris' },
              'Netherlands': { postalLabel: 'Postcode *', postalPlaceholder: '1234 AB', cityLabel: 'Stad *', cityPlaceholder: 'Amsterdam' },
              'Portugal': { postalLabel: 'Código postal *', postalPlaceholder: '1000-001', cityLabel: 'Cidade *', cityPlaceholder: 'Lisboa' },
              'Australia': { postalLabel: 'Postcode *', postalPlaceholder: '2000', cityLabel: 'Suburb/State *', cityPlaceholder: 'Sydney NSW' },
              'Japan': { postalLabel: '郵便番号 *', postalPlaceholder: '100-0001', cityLabel: '市区町村 *', cityPlaceholder: '東京' },
              'Brazil': { postalLabel: 'CEP *', postalPlaceholder: '01310-100', cityLabel: 'Cidade *', cityPlaceholder: 'São Paulo' },
              'Mexico': { postalLabel: 'Código postal *', postalPlaceholder: '01000', cityLabel: 'Ciudad *', cityPlaceholder: 'CDMX' },
            };
            const l = locale[c] || { postalLabel: 'Postal code *', postalPlaceholder: '1234 AB', cityLabel: 'City *', cityPlaceholder: 'Amsterdam' };
            return (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.postalLabel}</Label>
                  <Input value={formData.postalCode} onChange={(e) => updateFormData('postalCode', e.target.value)} placeholder={l.postalPlaceholder} className="h-11 bg-background" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.cityLabel}</Label>
                  <Input value={formData.city} onChange={(e) => updateFormData('city', e.target.value)} placeholder={l.cityPlaceholder} className="h-11 bg-background" />
                </div>
              </div>
            );
          })()}

        </div>

        {/* Shipping method */}
        <div className="border border-border rounded-lg p-4 mb-8">
          <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-3">Shipping method</h2>
          {!isAddressComplete() ? (
            <div className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-6 text-center">
              <p className="text-xs text-muted-foreground">Complete your address above to see shipping options</p>
            </div>
          ) : (
            <div className="space-y-2">
              {([
                { id: 'standard' as ShippingMethod, label: 'Standard Shipping', price: 3.99, eta: 'EU & UK: 4–6 business days · International: 6–8 business days' },
                { id: 'express' as ShippingMethod, label: 'Express Shipping', price: 12.99, eta: 'Worldwide: 2–4 business days' },
              ]).map((opt) => {
                const selected = shippingMethod === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setShippingMethod(opt.id)}
                    className={cn(
                      "w-full text-left flex items-center gap-3 rounded-md border px-3 py-3 transition-colors",
                      selected ? "border-accent bg-accent/5" : "border-border bg-background hover:border-accent/50"
                    )}
                  >
                    <span className={cn(
                      "h-4 w-4 rounded-full border flex items-center justify-center flex-shrink-0",
                      selected ? "border-accent" : "border-muted-foreground/50"
                    )}>
                      {selected && <span className="h-2 w-2 rounded-full bg-accent" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{opt.label}</p>
                        {opt.id === 'express' && (
                          <span className="inline-flex items-center rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent border border-accent/20">
                            Priority Tracked
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{opt.eta}</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{formatPrice(opt.price)}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>


        {/* Order Summary */}
        <div className="border border-border rounded-lg p-4 mb-8">
          <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-3">Order summary</h2>
          <div className="space-y-3">
            {items.map((item) => {
              const cartKey = item.selectedMl ? `${item.product.id}-${item.selectedMl}` : item.product.id;
              const displayPrice = item.selectedPrice || item.product.price;
              return (
                <div key={cartKey} className="flex items-center gap-3">
                  <div className={cn("w-10 h-12 bg-secondary/50 overflow-hidden flex-shrink-0 rounded border border-border", item.product.imagePadding && "p-0.5")}>
                    {item.product.bundleImages && item.product.bundleImages.length > 0 ? (
                      <div className="flex items-end justify-center gap-0.5 h-full p-0.5">
                        {item.product.bundleImages.map((img, imgIdx) => (
                          <img key={imgIdx} src={img} alt="" className="h-[70%] w-auto object-contain" />
                        ))}
                      </div>
                    ) : (
                      <img src={item.product.image} alt={item.product.name} className={cn("w-full h-full", item.product.imagePadding ? "object-contain" : "object-cover")} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity > 1 && `${item.quantity}× `}{item.selectedMl && `${item.selectedMl}ml`}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{formatPrice(displayPrice * item.quantity)}</p>
                </div>
              );
            })}
          </div>

          {/* Free 2ml sample picker */}
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex items-start gap-2 mb-2">
              <Gift className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">Pick a FREE 2ml sample 🎁</p>
                <p className="text-[10px] text-muted-foreground">Try any fragrance from our store — on the house, so you know what to get next.</p>
              </div>
            </div>
            {freeSample ? (
              <div className="flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-md px-3 py-2">
                <img src={freeSample.image} alt={freeSample.name} className="w-8 h-9 object-contain bg-secondary/50 rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{freeSample.name}</p>
                  <p className="text-[10px] text-muted-foreground">2ml sample · FREE</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFreeSample(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Popover open={sampleOpen} onOpenChange={setSampleOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full h-10 justify-between bg-background border-dashed border-accent/50 text-xs font-medium text-accent hover:bg-accent/5">
                    Choose your free sample
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search fragrance..." />
                    <CommandList>
                      <CommandEmpty>No fragrance found.</CommandEmpty>
                      <CommandGroup>
                        {sampleOptions.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={`${p.brand} ${p.name}`}
                            onSelect={() => {
                              setFreeSample({ id: p.id, name: p.name, brand: p.brand, image: p.image });
                              setSampleOpen(false);
                            }}
                          >
                            <img src={p.image} alt="" className="w-6 h-7 object-contain mr-2 bg-secondary/50 rounded" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{p.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{p.brand}</p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>


          {/* Discount code inline */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-border">
            <Input
              type="text"
              placeholder="Discount code"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              className="h-9 flex-1 bg-background border-border rounded-md text-sm"
            />
            <Button variant="outline" onClick={handleApplyDiscount} disabled={!discountCode || isApplyingDiscount} className="h-9 px-4 rounded-md text-xs font-medium">
              Apply
            </Button>
          </div>

          {/* Price breakdown */}
          <div className="mt-4 pt-3 border-t border-border space-y-1.5">
            {freeItemDiscount > 0 && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-muted-foreground line-through">{formatPrice(subtotalBeforeDiscount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-accent font-medium">🎉 Buy 2 Get 1 Free ({freeItemsCount} free)</span>
                  <span className="text-accent font-medium">-{formatPrice(freeItemDiscount)}</span>
                </div>
              </>
            )}
            {appliedDiscount && (
              <div className="flex justify-between text-xs">
                <span className="text-accent font-medium">Code: {appliedDiscount.code} ({appliedDiscount.percent}%)</span>
                <span className="text-accent font-medium">-{formatPrice(totalPrice * appliedDiscount.percent / 100)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Shipping</span>
              {formData.country ? (
                <span className="text-foreground">{formatPrice(shippingCost)}</span>
              ) : (
                <span className="text-muted-foreground italic">Select country above</span>
              )}
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-base font-semibold text-foreground">Total</span>
              <div className="text-right">
                <span className="text-lg font-bold text-foreground">{formatPrice(currentTotal)}</span>
                <p className="text-[10px] text-muted-foreground">Tax included</p>
              </div>
            </div>
          </div>

          {/* Delivery info */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
            <span>📦</span>
            <span><span className="font-medium text-foreground">DHL Delivery</span> — {shippingMethod === 'express' ? 'Express: 2–4 business days worldwide' : 'Standard: EU & UK 4–6 days · International 6–8 days'} · Tracking by email</span>
          </div>
        </div>

        {/* Delivery timeline */}
        <div className="mb-8">
          <DeliveryInfo method={shippingMethod} />
        </div>

        {/* Payment buttons */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">Choose payment</h2>

          <Link to="/return-policy" className="flex items-center justify-center gap-2 rounded-lg border border-accent bg-accent/10 px-4 py-2.5 text-xs font-semibold text-accent transition-all hover:bg-accent hover:text-accent-foreground">
            📋 Read our return and refund policy before purchasing →
          </Link>

          <PaymentMethodExplainer />

          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm font-medium text-foreground">Processing your payment...</span>
            </div>
          )}

          {!isFormValid() && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 text-center">
              Fill in all fields above to continue
            </p>
          )}

          {showBancontact && (
            <div className="relative rounded-xl border-2 border-[#005498] bg-gradient-to-br from-[#005498]/5 to-transparent p-3 shadow-md">
              <span className="absolute -top-2 left-3 px-2 py-0.5 rounded-full bg-[#005498] text-white text-[10px] font-bold tracking-wider uppercase">Recommended</span>
              <Button
                type="button"
                disabled={!isFormValid() || isProcessing}
                className="w-full h-12 rounded-lg text-sm font-bold tracking-wide bg-[#005498] hover:bg-[#003F73] text-white"
                onClick={() => handlePayment('bancontact')}
              >
                <span className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight">BC</span>
                  Pay with Bancontact
                </span>
              </Button>
              <p className="text-[11px] text-muted-foreground text-center mt-2 leading-snug">
                Full buyer protection · chargebacks · pay with card, Apple Pay, Google Pay
              </p>
            </div>
          )}


          {/* Card / Apple Pay / Google Pay */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-wide text-foreground">Watch how to pay with card or Apple Pay</h3>
              <button
                type="button"
                onClick={handleRewarbleFullscreen}
                aria-label="Fullscreen"
                className="rounded-md bg-black/60 hover:bg-black/80 text-white p-1.5 backdrop-blur-sm transition-colors"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="relative">
              <video
                ref={rewarbleVideoRef}
                controls
                playsInline
                preload="metadata"
                className="w-full aspect-video bg-black"
              >
                <source src="/videos/rewarble-tutorial.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="px-4 py-2.5 border-t border-border">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Step-by-step: open G2A → choose your amount → pay with card, Apple Pay or Google Pay → paste the code here after purchase.
              </p>
            </div>
          </div>

          <Button
            type="button"
            disabled={!isFormValid() || isProcessing}
            className="w-full h-12 rounded-lg text-sm font-bold tracking-wide bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
            onClick={() => handlePayment('rewarble')}
          >
            💳 Pay with Card / Apple Pay / Google Pay
          </Button>
          {/* Small payment logos - clearly just decorative icons */}
          <div className="flex items-center justify-center gap-1.5 opacity-50">
            <svg width="28" height="18" viewBox="0 0 48 32" fill="none"><rect x="0.5" y="0.5" width="47" height="31" rx="3.5" fill="#1A1F71" stroke="#2A2F81"/><text x="24" y="20" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Arial, sans-serif">VISA</text></svg>
            <svg width="28" height="18" viewBox="0 0 48 32" fill="none"><rect x="0.5" y="0.5" width="47" height="31" rx="3.5" fill="#fff" stroke="#ddd"/><circle cx="19" cy="16" r="8" fill="#EB001B"/><circle cx="29" cy="16" r="8" fill="#F79E1B"/><path d="M24 9.8a8 8 0 0 1 0 12.4 8 8 0 0 1 0-12.4z" fill="#FF5F00"/></svg>
            <div className="w-[28px] h-[18px] rounded border border-border/30 overflow-hidden bg-white flex items-center justify-center">
              <img src="/images/apple-pay.png" alt="Apple Pay" className="h-full w-full object-contain" />
            </div>
            <div className="w-[28px] h-[18px] rounded border border-border/30 overflow-hidden bg-white flex items-center justify-center">
              <img src="/images/google-pay.png" alt="Google Pay" className="h-full w-full object-contain" />
            </div>
            <div className="w-[28px] h-[18px] rounded border border-border/30 overflow-hidden bg-white flex items-center justify-center">
              <img src="/images/paysafecard.png" alt="Paysafecard" className="h-full w-full object-contain" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Cash on Delivery */}
          <Button
            type="button"
            disabled={!isFormValid() || isProcessing}
            className="w-full h-12 rounded-lg text-sm font-bold tracking-wide bg-emerald-700 hover:bg-emerald-800 text-white"
            onClick={handleCashOnDelivery}
          >
            <span className="flex items-center gap-2">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : '💶'}
              Cash on Delivery
            </span>
          </Button>

          {/* iDEAL */}
          <Button
            type="button"
            disabled={!isFormValid() || isProcessing}
            className="w-full h-12 rounded-lg text-sm font-bold tracking-wide bg-[#CC0066] hover:bg-[#A30052] text-white"
            onClick={() => handlePayment('ideal')}
          >
            <span className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="white"/><text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#CC0066" fontFamily="sans-serif">iD</text></svg>
              Pay with iDEAL
            </span>
          </Button>

          {/* PayPal */}
          <Button
            type="button"
            disabled={!isFormValid() || isProcessing}
            className="w-full h-12 rounded-lg text-sm font-bold tracking-wide bg-[#0070BA] hover:bg-[#005C99] text-white"
            onClick={() => handlePayment('paypal')}
          >
            <span className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.645h6.527c2.168 0 3.87.458 5.048 1.36 1.236.945 1.86 2.378 1.86 4.26 0 .376-.04.758-.117 1.15-.727 3.655-3.25 5.507-7.516 5.507H9.522a.77.77 0 0 0-.757.645l-1.69 5.34z" fill="white"/><path d="M20.16 8.848c-.727 3.655-3.25 5.507-7.516 5.507H10.66a.77.77 0 0 0-.757.645l-1.15 3.63-.486 3.085a.641.641 0 0 0 .633.74h3.34a.77.77 0 0 0 .757-.645l.632-3.18a.77.77 0 0 1 .757-.645h1.594c4.267 0 6.79-1.852 7.516-5.507.41-2.06-.076-3.655-1.337-4.63z" fill="rgba(255,255,255,0.7)"/></svg>
              Pay with PayPal
            </span>
          </Button>


          <p className="text-[10px] text-muted-foreground/60 text-center">
            By completing this purchase you agree to our terms and conditions
          </p>

          <div className="flex flex-col items-center gap-1.5 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-accent" />
              <span className="text-[10px]">256-bit SSL encrypted · Buyer protection included</span>
            </div>
          </div>
        </div>
        </fieldset>
      </div>
    </div>

  );
};

export default Checkout;
