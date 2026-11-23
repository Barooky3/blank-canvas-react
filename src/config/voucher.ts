// Single source of truth for the Eneba voucher brand used at checkout.
// To switch brands, run: node scripts/voucher-brand.mjs rewarble   (or: rewup)
// The script flips ACTIVE_VOUCHER below and swaps the brand name in all customer-facing copy.
export const VOUCHER_BRANDS = {
  rewarble: {
    name: 'Rewarble',
    route: 'rewarble',
    iconUrl: '/images/rewarble-icon.svg',
    enebaUrl: 'https://www.eneba.com/rewarble-rewarble-bank-transfer-15-eur-voucher-global',
    videoUrl: '/videos/checkout-tutorial-eneba.mp4',
  },
  rewup: {
    name: 'Rewup',
    route: 'rewup',
    iconUrl: '/images/rewup-icon.png',
    enebaUrl: 'https://www.eneba.com/rewup-rewup-paypal-20-gbp-voucher-global',
    videoUrl: '/videos/checkout-tutorial-rewup.mp4',
  },
} as const;

export const ACTIVE_VOUCHER: keyof typeof VOUCHER_BRANDS = 'rewup';

export const VOUCHER = VOUCHER_BRANDS[ACTIVE_VOUCHER];
