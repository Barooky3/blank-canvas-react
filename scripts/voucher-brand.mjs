#!/usr/bin/env node
// Swap the customer-facing voucher brand between Rewarble and Rewup.
// Usage: node scripts/voucher-brand.mjs rewup | rewarble
// Internal identifiers (paymentMethod 'rewarble', checkout_reference prefixes,
// sessionStorage keys, file names) are intentionally left untouched so existing
// orders, admin tooling and edge functions keep working.
import { readFileSync, writeFileSync } from 'node:fs';

const target = process.argv[2];
if (target !== 'rewup' && target !== 'rewarble') {
  console.error('Usage: node scripts/voucher-brand.mjs rewup|rewarble');
  process.exit(1);
}

const FILES = [
  'src/pages/Rewarble.tsx',
  'src/pages/PaypalEneba.tsx',
  'src/pages/IdealPayment.tsx',
  'src/pages/Account.tsx',
  'src/pages/AdminOrders.tsx',
  'src/pages/EmailPreview.tsx',
  'src/components/PaymentMethodExplainer.tsx',
  'src/components/chat/ChatPresets.tsx',
  'src/components/SocialProofPopup.tsx',
  'supabase/functions/admin-orders/index.ts',
  'supabase/functions/handle-order-action/index.ts',
  'supabase/functions/request-order-approval/index.ts',
];

const [from, to, FROM_UP, TO_UP] =
  target === 'rewup'
    ? ['Rewarble', 'Rewup', 'REWARBLE', 'REWUP']
    : ['Rewup', 'Rewarble', 'REWUP', 'REWARBLE'];

// Skip component identifiers like `const Rewarble =` / `export default Rewarble`.
const nameRe = new RegExp(`(?<!const |default )\\b${from}\\b`, 'g');
const upperRe = new RegExp(`\\b${FROM_UP} CODE\\b`, 'g');

let total = 0;
for (const file of FILES) {
  const src = readFileSync(file, 'utf8');
  const out = src.replace(nameRe, to).replace(upperRe, `${TO_UP} CODE`);
  if (out !== src) {
    writeFileSync(file, out);
    const n = (src.match(nameRe) || []).length + (src.match(upperRe) || []).length;
    total += n;
    console.log(`${file}: ${n}`);
  }
}

const cfg = 'src/config/voucher.ts';
writeFileSync(
  cfg,
  readFileSync(cfg, 'utf8').replace(
    /ACTIVE_VOUCHER: keyof typeof VOUCHER_BRANDS = '\w+'/,
    `ACTIVE_VOUCHER: keyof typeof VOUCHER_BRANDS = '${target}'`,
  ),
);
console.log(`Done: ${total} replacements, active voucher = ${target}`);
