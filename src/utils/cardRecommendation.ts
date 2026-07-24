import { Currency, CURRENCIES } from '@/contexts/CurrencyContext';

const CARD_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
};

// Actual available Rewarble card denominations per currency
const AVAILABLE_DENOMINATIONS: Record<string, number[]> = {
  EUR: [5, 10, 20, 25, 30, 35, 40, 45, 50],
  USD: [5, 10, 15, 20, 25, 30, 35, 45, 50],
  GBP: [5, 10, 15, 20, 35, 45, 50],
};

/**
 * Given an order total in EUR, finds the available card denomination across EUR/USD/GBP
 * that is closest to the actual EUR total (to minimise over/underpay).
 */
export function getCardRecommendation(eurTotal: number, _userCurrency: Currency): string {
  let bestCurrency = 'EUR';
  let bestDenom = 50;
  let bestOverpayEur = Infinity;

  for (const [cc, denoms] of Object.entries(AVAILABLE_DENOMINATIONS)) {
    const info = CURRENCIES.find(c => c.code === cc);
    if (!info) continue;

    for (const denom of denoms) {
      const denomInEur = denom / info.rate;
      // Only consider denominations that cover the total (no underpay)
      if (denomInEur >= eurTotal - 0.01) {
        const overpay = denomInEur - eurTotal;
        if (overpay < bestOverpayEur) {
          bestOverpayEur = overpay;
          bestDenom = denom;
          bestCurrency = cc;
        }
      }
    }
  }

  const symbol = CARD_SYMBOLS[bestCurrency];
  return `${symbol}${bestDenom}`;
  return `${symbol}${bestDenom}`;
}

// PayPal Rewarble EUR cards actually listed on G2A, with direct product URLs.
// Prefers GLOBAL region; falls back to EUROPE region for denominations not sold globally.
const PAYPAL_REWARBLE_CARDS_EUR: { denom: number; url: string }[] = [
  { denom: 1,   url: 'https://www.g2a.com/paypal-gift-card-1-eur-by-rewarble-europe-i10000339995243' },
  { denom: 2,   url: 'https://www.g2a.com/paypal-gift-card-2-eur-by-rewarble-europe-i10000339995244' },
  { denom: 3,   url: 'https://www.g2a.com/paypal-gift-card-3-eur-by-rewarble-europe-i10000339995245' },
  { denom: 4,   url: 'https://www.g2a.com/paypal-gift-card-4-eur-by-rewarble-europe-i10000339995246' },
  { denom: 5,   url: 'https://www.g2a.com/paypal-gift-card-5-eur-by-rewarble-global-i10000339995019' },
  { denom: 6,   url: 'https://www.g2a.com/paypal-gift-card-6-eur-by-rewarble-global-i10000339995092' },
  { denom: 7,   url: 'https://www.g2a.com/paypal-gift-card-7-eur-by-rewarble-global-i10000339995093' },
  { denom: 8,   url: 'https://www.g2a.com/paypal-gift-card-8-eur-by-rewarble-global-i10000339995094' },
  { denom: 9,   url: 'https://www.g2a.com/paypal-gift-card-9-eur-by-rewarble-global-i10000339995095' },
  { denom: 10,  url: 'https://www.g2a.com/paypal-gift-card-10-eur-by-rewarble-global-i10000339995006' },
  { denom: 15,  url: 'https://www.g2a.com/paypal-gift-card-15-eur-by-rewarble-global-i10000339995020' },
  { denom: 20,  url: 'https://www.g2a.com/paypal-gift-card-20-eur-by-rewarble-global-i10000339995005' },
  { denom: 25,  url: 'https://www.g2a.com/paypal-gift-card-25-eur-by-rewarble-global-i10000339995003' },
  { denom: 30,  url: 'https://www.g2a.com/paypal-gift-card-30-eur-by-rewarble-global-i10000339995002' },
  { denom: 35,  url: 'https://www.g2a.com/paypal-gift-card-35-eur-by-rewarble-global-i10000339995096' },
  { denom: 40,  url: 'https://www.g2a.com/paypal-gift-card-40-eur-by-rewarble-global-i10000339995021' },
  { denom: 45,  url: 'https://www.g2a.com/paypal-gift-card-45-eur-by-rewarble-global-i10000339995097' },
  { denom: 50,  url: 'https://www.g2a.com/paypal-gift-card-50-eur-by-rewarble-global-i10000339995013' },
  { denom: 55,  url: 'https://www.g2a.com/paypal-gift-card-55-eur-by-rewarble-global-i10000339995098' },
  { denom: 60,  url: 'https://www.g2a.com/paypal-gift-card-60-eur-by-rewarble-global-i10000339995001' },
  { denom: 65,  url: 'https://www.g2a.com/paypal-gift-card-65-eur-by-rewarble-global-i10000339995099' },
  { denom: 70,  url: 'https://www.g2a.com/paypal-gift-card-70-eur-by-rewarble-global-i10000339995100' },
  { denom: 75,  url: 'https://www.g2a.com/paypal-gift-card-75-eur-by-rewarble-global-i10000339995121' },
  { denom: 80,  url: 'https://www.g2a.com/paypal-gift-card-80-eur-by-rewarble-global-i10000339995101' },
  { denom: 90,  url: 'https://www.g2a.com/paypal-gift-card-90-eur-by-rewarble-global-i10000339995102' },
  { denom: 100, url: 'https://www.g2a.com/paypal-gift-card-100-eur-by-rewarble-global-i10000339995004' },
  { denom: 110, url: 'https://www.g2a.com/paypal-gift-card-110-eur-by-rewarble-europe-i10000339995247' },
  { denom: 120, url: 'https://www.g2a.com/paypal-gift-card-120-eur-by-rewarble-europe-i10000339995248' },
  { denom: 130, url: 'https://www.g2a.com/paypal-gift-card-130-eur-by-rewarble-europe-i10000339995249' },
  { denom: 150, url: 'https://www.g2a.com/paypal-gift-card-150-eur-by-rewarble-global-i10000339995122' },
  { denom: 160, url: 'https://www.g2a.com/paypal-gift-card-160-eur-by-rewarble-europe-i10000339995251' },
  { denom: 170, url: 'https://www.g2a.com/paypal-gift-card-170-eur-by-rewarble-europe-i10000339995252' },
  { denom: 200, url: 'https://www.g2a.com/paypal-gift-card-200-eur-by-rewarble-global-i10000339995033' },
  { denom: 220, url: 'https://www.g2a.com/paypal-gift-card-220-eur-by-rewarble-europe-i10000339995256' },
  { denom: 250, url: 'https://www.g2a.com/paypal-gift-card-250-eur-by-rewarble-global-i10000339995123' },
  { denom: 300, url: 'https://www.g2a.com/paypal-gift-card-300-eur-by-rewarble-global-i10000339995034' },
  { denom: 350, url: 'https://www.g2a.com/paypal-gift-card-350-eur-by-rewarble-global-i10000339995115' },
  { denom: 400, url: 'https://www.g2a.com/paypal-gift-card-400-eur-by-rewarble-global-i10000339995103' },
  { denom: 500, url: 'https://www.g2a.com/paypal-gift-card-500-eur-by-rewarble-global-i10000339995117' },
];

export interface VisaRewarbleCard {
  denom: number;
  label: string; // e.g. "€25"
  url: string;   // G2A direct product URL for that specific card
}

/**
 * Returns the PayPal Rewarble EUR card on G2A whose denomination is closest to the cart total.
 */
export function getVisaRewarbleCard(eurTotal: number): VisaRewarbleCard {
  const best = PAYPAL_REWARBLE_CARDS_EUR.reduce((acc, c) =>
    Math.abs(c.denom - eurTotal) < Math.abs(acc.denom - eurTotal) ? c : acc,
    PAYPAL_REWARBLE_CARDS_EUR[0]
  );
  return { denom: best.denom, label: `€${best.denom}`, url: best.url };
}
