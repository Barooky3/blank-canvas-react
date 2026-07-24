import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_DISCOUNT_CODES: Record<string, number> = {
  'professor15': 15,
  'parfum10': 10,
  'parfumz20': 20,
  'parfumo30': 30,
  'parfuma90': 90,
  'parfumz50': 50,
};

interface CartLineItem {
  name: string;
  brand: string;
  image: string;
  price: number;
  quantity: number;
  selectedMl?: number;
}

interface CheckoutRequest {
  items: CartLineItem[];
  customerEmail: string;
  customerName: string;
  shippingAddress: {
    country: string;
    city: string;
    postalCode: string;
    line1: string;
  };
  discountCode?: string;
  freeItemDiscount?: number;
}

async function getAccessToken(clientId: string, clientSecret: string) {
  const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    console.error("PayPal token error:", JSON.stringify(tokenData));
    throw new Error("Failed to authenticate with PayPal");
  }
  return tokenData.access_token;
}

const COUNTRY_CODE_MAP: Record<string, string> = {
  'Netherlands': 'NL', 'Belgium': 'BE', 'Germany': 'DE', 'France': 'FR', 'United Kingdom': 'GB',
  'Spain': 'ES', 'Italy': 'IT', 'Austria': 'AT', 'Switzerland': 'CH', 'Portugal': 'PT',
  'Poland': 'PL', 'Sweden': 'SE', 'Denmark': 'DK', 'Norway': 'NO', 'Finland': 'FI',
  'Ireland': 'IE', 'Luxembourg': 'LU', 'Czech Republic': 'CZ', 'Greece': 'GR', 'Hungary': 'HU',
  'Romania': 'RO', 'Bulgaria': 'BG', 'Croatia': 'HR', 'Slovakia': 'SK', 'Slovenia': 'SI',
  'Serbia': 'RS', 'Estonia': 'EE', 'Latvia': 'LV', 'Lithuania': 'LT', 'Iceland': 'IS',
  'Turkey': 'TR', 'Russia': 'RU', 'Ukraine': 'UA', 'Bosnia and Herzegovina': 'BA',
  'Montenegro': 'ME', 'North Macedonia': 'MK', 'Albania': 'AL', 'Moldova': 'MD',
  'Cyprus': 'CY', 'Malta': 'MT', 'Monaco': 'MC', 'Liechtenstein': 'LI', 'Andorra': 'AD',
  'Kosovo': 'XK', 'Belarus': 'BY', 'Georgia': 'GE', 'Armenia': 'AM', 'Azerbaijan': 'AZ', 'San Marino': 'SM', 'Kazakhstan': 'KZ',
  'United States': 'US', 'Canada': 'CA', 'Mexico': 'MX',
  'Brazil': 'BR', 'Argentina': 'AR', 'Chile': 'CL', 'Colombia': 'CO', 'Peru': 'PE',
  'Ecuador': 'EC', 'Uruguay': 'UY', 'Paraguay': 'PY', 'Bolivia': 'BO', 'Venezuela': 'VE',
  'Dominican Republic': 'DO', 'Jamaica': 'JM', 'Trinidad and Tobago': 'TT', 'Barbados': 'BB',
  'Curaçao': 'CW', 'Suriname': 'SR',
  'United Arab Emirates': 'AE', 'Saudi Arabia': 'SA', 'Qatar': 'QA', 'Kuwait': 'KW',
  'Bahrain': 'BH', 'Oman': 'OM', 'Israel': 'IL', 'Jordan': 'JO', 'Lebanon': 'LB', 'Iraq': 'IQ',
  'Japan': 'JP', 'South Korea': 'KR', 'China': 'CN', 'India': 'IN', 'Thailand': 'TH',
  'Vietnam': 'VN', 'Indonesia': 'ID', 'Malaysia': 'MY', 'Singapore': 'SG', 'Philippines': 'PH',
  'Hong Kong': 'HK', 'Taiwan': 'TW', 'Pakistan': 'PK', 'Bangladesh': 'BD',
  'Sri Lanka': 'LK', 'Nepal': 'NP', 'Cambodia': 'KH', 'Myanmar': 'MM', 'Macao': 'MO',
  'Australia': 'AU', 'New Zealand': 'NZ', 'Fiji': 'FJ',
  'South Africa': 'ZA', 'Egypt': 'EG', 'Morocco': 'MA', 'Nigeria': 'NG',
  'Kenya': 'KE', 'Ghana': 'GH', 'Tunisia': 'TN',
  'Zimbabwe': 'ZW',
  'Algeria': 'DZ', 'Senegal': 'SN', 'Ivory Coast': 'CI', 'Cameroon': 'CM',
  'Tanzania': 'TZ', 'Ethiopia': 'ET', 'Mauritius': 'MU',
};

function getCountryCode(country: string): string {
  return COUNTRY_CODE_MAP[country] || 'NL';
}
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("PAYPAL_CLIENT_ID") || "";
    const clientSecret = Deno.env.get("PAYPAL_SECRET") || "";
    if (!clientId || !clientSecret) throw new Error("PayPal credentials not configured");

    const { items, customerEmail, customerName, shippingAddress, discountCode, freeItemDiscount } =
      (await req.json()) as CheckoutRequest;

    const discount = VALID_DISCOUNT_CODES[discountCode?.toLowerCase().trim() || ''] ?? 0;
    const multiplier = 1 - discount / 100;

    if (!items || items.length === 0) throw new Error("No items in cart");

    // Expand all cart items into individual units sorted by price (cheapest first)
    const expandedUnits: { itemIndex: number; price: number }[] = [];
    items.forEach((item, idx) => {
      for (let i = 0; i < item.quantity; i++) {
        expandedUnits.push({ itemIndex: idx, price: item.price });
      }
    });
    expandedUnits.sort((a, b) => a.price - b.price);

    const totalUnits = expandedUnits.length;
    const freeCount = Math.floor(totalUnits / 3);

    const freePerItem: number[] = new Array(items.length).fill(0);
    for (let i = 0; i < freeCount; i++) {
      freePerItem[expandedUnits[i].itemIndex]++;
    }

    const paypalItems: any[] = [];
    let orderTotal = 0;

    items.forEach((item, idx) => {
      const freeQty = freePerItem[idx];
      const paidQty = item.quantity - freeQty;
      const label = `${item.brand} - ${item.name}${item.selectedMl ? ` (${item.selectedMl}ml)` : ""}`;

      if (paidQty > 0) {
        const unitPrice = Math.max(Math.round(item.price * 100 * multiplier) / 100, 0);
        const lineTotal = Math.round(unitPrice * paidQty * 100) / 100;
        orderTotal += lineTotal;
        paypalItems.push({
          name: label.substring(0, 127),
          quantity: String(paidQty),
          unit_amount: { currency_code: "EUR", value: unitPrice.toFixed(2) },
        });
      }

      if (freeQty > 0) {
        paypalItems.push({
          name: `${label} (FREE)`.substring(0, 127),
          quantity: String(freeQty),
          unit_amount: { currency_code: "EUR", value: "0.00" },
        });
      }
    });

    orderTotal = Math.round(orderTotal * 100) / 100;

    const accessToken = await getAccessToken(clientId, clientSecret);

    // Create PayPal order — NO redirect URLs needed for JS SDK flow
    const orderRes = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "EUR",
              value: orderTotal.toFixed(2),
              breakdown: {
                item_total: { currency_code: "EUR", value: orderTotal.toFixed(2) },
              },
            },
            items: paypalItems,
            description: "Prof Parfums Order",
            shipping: {
              name: { full_name: customerName },
              address: {
                address_line_1: shippingAddress.line1,
                admin_area_2: shippingAddress.city,
                postal_code: shippingAddress.postalCode,
                country_code: getCountryCode(shippingAddress.country),
              },
            },
          },
        ],
        application_context: {
          shipping_preference: "SET_PROVIDED_ADDRESS",
        },
      }),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      console.error("PayPal order error:", JSON.stringify(orderData));
      throw new Error(orderData.details?.[0]?.description || "Failed to create PayPal order");
    }

    // Return order ID for JS SDK
    return new Response(JSON.stringify({ orderID: orderData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: "Unable to create checkout" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
