// Renders public/videos/checkout-tutorial-rewup.mp4 — the Eneba RewUp voucher tutorial.
// Copy, values, prices, vendor and payment methods mirror the live Eneba page
// (eneba.com/rewup-rewup-paypal-20-gbp-voucher-global, checked 2026-11-24, EUR display).
// The older Rewarble version is render-eneba-tutorial.mjs -> checkout-tutorial-eneba.mp4.
//
// Tooling lives outside the repo (installed into /tmp/ff):
//   npm i --prefix /tmp/ff satori@0.10 @resvg/resvg-js @napi-rs/canvas @fontsource/inter ffmpeg-static
//   node scripts/tutorial-video/render-rewup-tutorial.mjs
import { createRequire } from 'module'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const TOOLS = process.env.TUTORIAL_TOOLS_DIR || '/tmp/ff/'
const require = createRequire(TOOLS)
const satori = require('satori').default
const { Resvg } = require('@resvg/resvg-js')
const { createCanvas, loadImage } = require('@napi-rs/canvas')
const ffmpegPath = require('ffmpeg-static')

const W = 1920
const H = 1080
const FPS = 30
const OUT = path.resolve(process.argv[2] || 'public/videos/checkout-tutorial-rewup.mp4')
const PREVIEW_DIR = process.env.TUTORIAL_PREVIEW_DIR

const fontFile = (w) => fs.readFileSync(path.join(TOOLS, `node_modules/@fontsource/inter/files/inter-latin-${w}-normal.woff`))
const fonts = [400, 500, 600, 700, 800].map((weight) => ({ name: 'Inter', data: fontFile(weight), weight, style: 'normal' }))

// ---------- tiny element helpers ----------
const clean = (children) => children.flat(Infinity).filter((c) => c !== null && c !== false && c !== undefined)
const h = (style, ...children) => ({ type: 'div', props: { style: { display: 'flex', ...style }, children: clean(children) } })
const abs = (left, top, width, height, style, ...children) =>
  h({ position: 'absolute', left, top, ...(width != null ? { width } : {}), ...(height != null ? { height } : {}), ...style }, ...children)
const T = (text, style = {}) => h(style, text)
const svgImg = (svg, size) => ({
  type: 'img',
  props: { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`, width: size, height: size },
})

// ---------- shared chrome ----------
const CODE = '9YVMBH7H4CXHCX7J'
const CART = '20.00'

function frame({ step, label, url, bg, content }) {
  return h(
    { width: W, height: H, position: 'relative', background: '#0a0f17', fontFamily: 'Inter' },
    abs(160, 100, 1600, 920, { background: bg, borderRadius: 18, border: '2px solid #222c3b' }),
    abs(
      160,
      100,
      1600,
      52,
      { background: '#1a2230', borderTopLeftRadius: 18, borderTopRightRadius: 18, alignItems: 'center', paddingLeft: 24, gap: 10 },
      ['#ef4444', '#f59e0b', '#22c55e'].map((c) => h({ width: 14, height: 14, borderRadius: 7, background: c })),
      h(
        { marginLeft: 20, marginRight: 24, flexGrow: 1, height: 32, borderRadius: 16, background: '#0f1520', alignItems: 'center', paddingLeft: 18, color: '#8b95a7', fontSize: 18 },
        url,
      ),
    ),
    content,
    abs(
      48,
      30,
      null,
      84,
      { borderRadius: 42, background: '#0f1724', border: '2px solid #243044', alignItems: 'center', paddingLeft: 14, paddingRight: 36, gap: 18 },
      h(
        { width: 56, height: 56, borderRadius: 28, background: '#3b82f6', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 30, fontWeight: 700 },
        String(step),
      ),
      T(label, { color: '#fff', fontSize: 34, fontWeight: 600 }),
    ),
  )
}

const warnIcon = (bg = '#f59e0b') =>
  h({ width: 28, height: 28, borderRadius: 14, background: bg, alignItems: 'center', justifyContent: 'center', color: '#1a1a1a', fontSize: 18, fontWeight: 800, flexShrink: 0 }, '!')

const numCircle = (n) =>
  h({ width: 38, height: 38, borderRadius: 19, background: '#7C3AED', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 700, flexShrink: 0 }, String(n))

// ---------- Parforium site (dark) ----------
function sitePayPage({ hover }) {
  return [
    abs(560, 176, 800, 60, { justifyContent: 'center', color: '#f5f5f5', fontSize: 44, fontWeight: 700 }, 'Pay with Rewup'),
    abs(
      580,
      256,
      760,
      128,
      { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 16, border: '2px solid rgba(124,58,237,0.5)', background: 'rgba(124,58,237,0.13)' },
      T('Order amount', { fontSize: 22, color: '#a3a3a3' }),
      T(`€${CART}`, { fontSize: 56, fontWeight: 700, color: '#fff' }),
    ),
    abs(
      580,
      402,
      760,
      62,
      { alignItems: 'center', gap: 14, paddingLeft: 20, borderRadius: 12, border: '2px solid rgba(245,158,11,0.45)', background: 'rgba(245,158,11,0.10)' },
      warnIcon(),
      T('Please follow the payment instructions carefully.', { fontSize: 21, color: '#fcd34d' }),
    ),
    abs(
      580,
      482,
      760,
      520,
      { flexDirection: 'column', borderRadius: 16, border: '2px solid #353535', background: '#272727' },
      h(
        { height: 62, alignItems: 'center', paddingLeft: 24, borderBottom: '2px solid #353535', background: '#2c2c2c', borderTopLeftRadius: 16, borderTopRightRadius: 16, fontSize: 23, fontWeight: 600, color: '#f5f5f5' },
        'Payment instructions',
      ),
      h(
        { padding: '22px 24px', gap: 16 },
        numCircle(1),
        h(
          { flexDirection: 'column', gap: 12, width: 640 },
          T('Buy a Rewup voucher on Eneba', { fontSize: 25, fontWeight: 700, color: '#fff' }),
          T(`Your cart total is €${CART}. Open the Rewup voucher on Eneba, pick a Value that covers your total and press "Buy now".`, {
            fontSize: 20,
            color: '#a8a8a8',
            lineHeight: 1.45,
          }),
          h(
            { gap: 10, flexWrap: 'wrap' },
            ['Visa', 'Mastercard', 'Apple Pay', 'Google Pay', 'PayPal', '& more'].map((c) =>
              h({ padding: '6px 12px', borderRadius: 8, background: '#363636', color: '#c4c4c4', fontSize: 17 }, c),
            ),
          ),
          h(
            { padding: '12px 16px', borderRadius: 10, border: '2px solid rgba(14,165,233,0.4)', background: 'rgba(14,165,233,0.10)', color: '#7dd3fc', fontSize: 18, lineHeight: 1.4 },
            'Values are in GBP. 1 GBP is worth more than 1 EUR, so a 20 GBP voucher covers a €20 order.',
          ),
        ),
      ),
    ),
    abs(
      658,
      912,
      400,
      62,
      {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        border: `2px solid ${hover ? '#a78bfa' : '#4d4d4d'}`,
        background: hover ? '#3b2a63' : '#303030',
        color: '#fff',
        fontSize: 22,
        fontWeight: 600,
      },
      'Open Rewup on Eneba',
    ),
  ]
}

function siteCodePage({ typed, focused, hover }) {
  const empty = typed.length === 0
  return [
    abs(
      580,
      176,
      760,
      110,
      { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 16, border: '2px solid rgba(124,58,237,0.5)', background: 'rgba(124,58,237,0.13)' },
      T('Order amount', { fontSize: 20, color: '#a3a3a3' }),
      T(`€${CART}`, { fontSize: 46, fontWeight: 700, color: '#fff' }),
    ),
    abs(580, 312, 760, 420, { borderRadius: 16, border: '2px solid #353535', background: '#272727' }),
    abs(
      580,
      312,
      760,
      62,
      { alignItems: 'center', paddingLeft: 24, borderBottom: '2px solid #353535', background: '#2c2c2c', borderTopLeftRadius: 16, borderTopRightRadius: 16, fontSize: 23, fontWeight: 600, color: '#f5f5f5' },
      'Enter your code',
    ),
    abs(612, 398, 600, 28, { fontSize: 18, fontWeight: 600, letterSpacing: 2, color: '#a3a3a3' }, 'REWUP CODE'),
    abs(
      612,
      432,
      696,
      76,
      {
        alignItems: 'center',
        paddingLeft: 24,
        borderRadius: 12,
        border: focused ? '3px solid #8b5cf6' : '2px solid #444',
        background: '#1b1b1b',
        fontSize: 30,
        letterSpacing: 2,
        color: empty ? '#6b6b6b' : '#fff',
      },
      empty && !focused ? 'Paste your code here' : typed,
      focused ? h({ width: 3, height: 36, marginLeft: 3, background: '#a78bfa' }) : null,
    ),
    abs(612, 528, 696, 56, { alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: '2px solid #3a3a3a', color: '#a78bfa', fontSize: 20, fontWeight: 600 }, '+ Add another code'),
    abs(
      612,
      604,
      696,
      100,
      { flexDirection: 'column', justifyContent: 'center', gap: 6, paddingLeft: 20, borderRadius: 10, border: '2px solid rgba(245,158,11,0.45)', background: 'rgba(245,158,11,0.10)' },
      T('Send the Rewup code, not the order number', { fontSize: 19, fontWeight: 700, color: '#fcd34d' }),
      T(`The code looks like ${CODE}`, { fontSize: 17, color: '#fde68a' }),
    ),
    abs(
      580,
      762,
      760,
      82,
      {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        background: hover ? '#15803d' : '#16a34a',
        color: '#fff',
        fontSize: 27,
        fontWeight: 700,
        boxShadow: '0 10px 30px rgba(22,163,74,0.35)',
      },
      'Confirm Payment',
    ),
  ]
}

function siteThanks() {
  const check = svgImg(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8b5a3c" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/></svg>',
    54,
  )
  return [
    abs(
      650,
      190,
      620,
      780,
      { flexDirection: 'column', alignItems: 'center', gap: 18, padding: '44px 46px', borderRadius: 24, border: '2px solid #ececec', background: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,0.06)' },
      h({ width: 104, height: 104, borderRadius: 52, background: '#efe6e1', alignItems: 'center', justifyContent: 'center' }, check),
      T('Thank you!', { fontSize: 48, fontWeight: 600, color: '#111' }),
      T('Order #1247', { fontSize: 21, fontWeight: 700, color: '#8b5a3c' }),
      T('Your order has been received. You will receive the order confirmation email as soon as the code is verified.', {
        fontSize: 21,
        color: '#555',
        lineHeight: 1.5,
        textAlign: 'center',
      }),
      h(
        { flexDirection: 'column', gap: 10, width: 528, padding: '20px 24px', borderRadius: 14, border: '2px solid #ead9cf', background: '#fbf7f4' },
        T('CHECK YOUR EMAIL AFTER APPROVAL', { fontSize: 18, fontWeight: 700, letterSpacing: 1.5, color: '#222' }),
        T('Once your order is approved, your confirmation and order details are sent to your inbox.', { fontSize: 19, color: '#555', lineHeight: 1.45 }),
      ),
      h(
        { width: 528, height: 68, marginTop: 6, borderRadius: 10, background: '#111', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 19, fontWeight: 700, letterSpacing: 2 },
        'CONTINUE SHOPPING',
      ),
    ),
  ]
}

// ---------- Eneba (purple) ----------
// Colours, values and EUR prices taken from the live page.
const ENEBA_BG = '#4a1bb0'
const ENEBA_DARK = '#2d0d7a'
const YELLOW = '#fad11e'
const panel = { borderRadius: 6, background: '#3a1594', border: '2px solid #5a33c4' }
const VALUES = [
  [2, '€2.78'],
  [5, '€6.41'],
  [8, '€10.28'],
  [10, '€12.99'],
  [20, '€26.53'],
  [25, '€33.29'],
  [30, '€40.06'],
  [40, '€53.62'],
]
const PRICE = Object.fromEntries(VALUES)
const PICK = 20
const PRODUCT = `RewUp PayPal ${PICK} GBP Voucher GLOBAL`
const FEE = '€1.93'
const TOTAL = '€28.46'

const enebaHeader = () =>
  abs(
    162,
    152,
    1596,
    84,
    { background: ENEBA_DARK, alignItems: 'center', paddingLeft: 40, paddingRight: 40, gap: 40 },
    T('eneba', { fontSize: 42, fontWeight: 800, color: '#fff', letterSpacing: -1 }),
    h({ width: 760, height: 52, border: '2px solid #8a6be0', alignItems: 'center', paddingLeft: 24, color: '#b9a8f0', fontSize: 20 }, 'Search for games, top-ups and more'),
    h({ marginLeft: 'auto', gap: 30, color: '#fff', fontSize: 20, fontWeight: 600 }, T('English EU | EUR'), T('Log in')),
  )

// PayPal "TOP UP" card art with the RewUp badge, as shown on the product page.
const voucherArt = (x, y, w, hgt, big = true) =>
  abs(
    x,
    y,
    w,
    hgt,
    { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: big ? 16 : 8, background: 'linear-gradient(160deg, #0aa3f0 0%, #0b5cd6 55%, #0a2a8a 100%)', position: 'relative' },
    T('PayPal', { fontSize: big ? 60 : 18, fontWeight: 800, color: '#fff', fontStyle: 'italic' }),
    T('TOP UP', { fontSize: big ? 16 : 7, fontWeight: 700, color: '#fff', marginLeft: big ? 120 : 34 }),
    big
      ? abs(16, hgt - 66, 50, 50, { borderRadius: 8, background: '#0c3b1d', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#7ee07e', fontSize: 14, fontWeight: 800, lineHeight: 1 }, T('rew'), T('up'))
      : null,
  )

function enebaProduct({ val, buyHover }) {
  return [
    enebaHeader(),
    abs(200, 258, 1500, 30, { color: '#c9bbf5', fontSize: 19 }, 'Store  >  Categories  >  E-money cards  >  RewUp  >  RewUp PayPal'),
    abs(200, 296, 380, 470, {}, voucherArt(0, 0, 380, 470)),
    abs(620, 296, 660, 56, { color: '#fff', fontSize: 31, fontWeight: 700 }, `RewUp PayPal ${val} GBP Voucher GLOBAL`),
    abs(620, 360, 640, 30, { gap: 26, color: '#c9bbf5', fontSize: 19 }, T('Global'), T('Digital key'), T('Instant delivery', { color: '#4ade80' })),
    abs(620, 410, 640, 30, { color: '#fff', fontSize: 21, fontWeight: 700 }, T('Value:'), T(` ${val} GBP`, { color: '#c9bbf5', fontWeight: 400, marginLeft: 8 })),
    VALUES.map(([v, price], i) => {
      const sel = v === val
      return abs(
        620 + (i % 4) * 160,
        452 + Math.floor(i / 4) * 128,
        148,
        114,
        {
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '14px 14px',
          border: sel ? '3px solid #fff' : '2px solid #5a33c4',
          background: sel ? '#2d0d7a' : '#3a1594',
          color: '#fff',
        },
        T(`${v} GBP`, { fontSize: 23, fontWeight: 700 }),
        T(price, { fontSize: 19, fontWeight: 600 }),
      )
    }),
    abs(1300, 296, 420, 520, panel),
    abs(1328, 320, 380, 30, { gap: 10, alignItems: 'center', fontSize: 19, color: '#fff', fontWeight: 700 }, T('AllisGifted'), h({ padding: '2px 10px', borderRadius: 10, border: '2px solid #6aa8ff', color: '#9cc6ff', fontSize: 15, fontWeight: 600 }, 'Top vendor')),
    abs(1328, 356, 380, 26, { color: '#fff', fontSize: 17 }, '9.92 Superb rating'),
    abs(1328, 396, 380, 66, { alignItems: 'flex-end', gap: 12 }, T(PRICE[val], { color: '#fff', fontSize: 52, fontWeight: 800 }), T('Price is not final', { color: '#c9bbf5', fontSize: 16, marginBottom: 10 })),
    abs(1328, 480, 364, 56, { alignItems: 'center', paddingLeft: 18, background: ENEBA_DARK, color: '#c9bbf5', fontSize: 18 }, `Selected:  ${val} GBP`),
    abs(1328, 552, 364, 56, { alignItems: 'center', justifyContent: 'center', background: '#fff', color: '#0b3aa8', fontSize: 26, fontWeight: 800, fontStyle: 'italic' }, 'PayPal'),
    abs(
      1328,
      622,
      364,
      66,
      { alignItems: 'center', justifyContent: 'center', background: buyHover ? '#ffe066' : YELLOW, color: '#12072b', fontSize: 25, fontWeight: 800 },
      'Buy now',
    ),
    abs(1328, 704, 364, 90, { flexDirection: 'column', gap: 6, color: '#c9bbf5', fontSize: 16 }, T('Safe Checkout Guaranteed'), T('Trusted Payment Methods'), T('Instant refunds for unviewed keys')),
    abs(
      200,
      840,
      1520,
      72,
      { alignItems: 'center', gap: 14, paddingLeft: 22, borderRadius: 8, border: '2px solid rgba(250,209,30,0.55)', background: 'rgba(250,209,30,0.10)', color: '#fde68a', fontSize: 20 },
      warnIcon(YELLOW),
      `Values are in GBP. Pick one that covers your cart total (20 GBP covers a €${CART} order).`,
    ),
  ]
}

function enebaCheckout({ selected, paid }) {
  // Order and wording match eneba.com/checkout/payment for this product.
  const methods = [
    ['Eneba Wallet', 'Pay with your Eneba wallet money', 'eneba'],
    ['PayPal', '', 'PayPal'],
    ['Apple Pay', 'Pay with Apple Pay', ' Pay'],
    ['Google Pay', 'Pay with Google Pay', 'G Pay'],
    ['Credit or debit card', 'Pay via Visa, Mastercard, or Maestro', 'VISA  MC'],
    ['PayPal Pay Later', '', 'Pay Later'],
  ]
  const CARD = 4
  return [
    abs(162, 152, 1596, 84, { background: ENEBA_DARK, alignItems: 'center', paddingLeft: 40, gap: 50 }, T('eneba', { fontSize: 42, fontWeight: 800, color: '#fff', letterSpacing: -1 }), T('Cart', { color: '#4ade80', fontSize: 19 }), T('2  Payment', { color: '#4ade80', fontSize: 19, fontWeight: 700 }), T('3  Get your product', { color: '#8f7bd0', fontSize: 19 })),
    methods.map(([name, sub, badge], i) => {
      const sel = selected && i === CARD
      return abs(
        200,
        268 + i * 100,
        900,
        88,
        { alignItems: 'center', gap: 22, paddingLeft: 20, paddingRight: 26, border: sel ? `3px solid ${YELLOW}` : '2px solid transparent', background: sel ? '#3a1594' : ENEBA_DARK },
        h({ width: 120, height: 56, borderRadius: 4, background: '#f3f3f3', alignItems: 'center', justifyContent: 'center', color: '#1a1f71', fontSize: 17, fontWeight: 800 }, badge),
        h({ flexDirection: 'column', gap: 4 }, T(name, { fontSize: 22, fontWeight: 700, color: '#fff' }), sub ? T(sub, { fontSize: 16, color: '#c9bbf5' }) : null),
        h(
          { marginLeft: 'auto', width: 26, height: 26, borderRadius: 13, border: `3px solid ${sel ? YELLOW : '#a594e0'}`, alignItems: 'center', justifyContent: 'center' },
          sel ? h({ width: 12, height: 12, borderRadius: 6, background: YELLOW }) : null,
        ),
      )
    }),
    abs(1140, 268, 580, 640, { background: ENEBA_DARK }),
    abs(1172, 292, 520, 28, { gap: 10, color: '#c9bbf5', fontSize: 17 }, T('Sold by'), T('AllisGifted', { color: '#fff', fontWeight: 700 })),
    voucherArt(1172, 334, 64, 84, false),
    abs(1252, 334, 440, 60, { color: '#fff', fontSize: 21, fontWeight: 700, lineHeight: 1.3 }, PRODUCT),
    abs(1252, 398, 300, 26, { color: '#c9bbf5', fontSize: 17 }, 'Digital product  ·  Qty 1'),
    abs(1172, 444, 520, 2, { background: '#4a2aa8' }),
    abs(1172, 462, 520, 28, { justifyContent: 'space-between', color: '#c9bbf5', fontSize: 19 }, T('Sub-total'), T(PRICE[PICK], { color: '#fff' })),
    abs(1172, 498, 520, 28, { justifyContent: 'space-between', color: '#c9bbf5', fontSize: 19 }, T('Service fee'), T(FEE, { color: '#fff' })),
    abs(1172, 534, 520, 28, { justifyContent: 'space-between', color: '#c9bbf5', fontSize: 19 }, T('Sales tax 0%'), T('€0.00', { color: '#fff' })),
    abs(1172, 580, 520, 40, { justifyContent: 'space-between', color: '#fff', fontSize: 28, fontWeight: 800 }, T('Total:'), T(TOTAL)),
    abs(
      1172,
      640,
      520,
      70,
      { alignItems: 'center', justifyContent: 'center', background: paid ? '#22c55e' : YELLOW, color: '#12072b', fontSize: 25, fontWeight: 800 },
      paid ? 'Payment successful' : 'Continue',
    ),
    abs(1172, 728, 520, 120, { color: '#c9bbf5', fontSize: 17, lineHeight: 1.45 }, 'Eneba asks for your name and billing address for prepaid vouchers. Any listed method works; the code arrives instantly by email.'),
  ]
}

function enebaKey({ copied }) {
  return [
    enebaHeader(),
    abs(200, 258, 1000, 56, { color: '#fff', fontSize: 42, fontWeight: 700 }, 'Your order'),
    abs(200, 316, 1200, 30, { color: '#9d8ec7', fontSize: 19 }, 'Order number 92000153603583 (this is NOT your code)'),
    abs(360, 370, 1200, 500, panel),
    voucherArt(400, 400, 96, 124, false),
    abs(522, 414, 980, 34, { color: '#fff', fontSize: 26, fontWeight: 700 }, PRODUCT),
    abs(522, 456, 600, 28, { color: '#4ade80', fontSize: 19, fontWeight: 600 }, 'Delivered instantly  ·  Sold by AllisGifted'),
    abs(400, 566, 600, 28, { color: '#c9bbf5', fontSize: 19, fontWeight: 700, letterSpacing: 2 }, 'YOUR REWUP CODE'),
    abs(
      400,
      604,
      860,
      104,
      { alignItems: 'center', paddingLeft: 34, borderRadius: 14, border: '3px solid #fad11e', background: '#12072b', color: '#fff', fontSize: 50, fontWeight: 700, letterSpacing: 5 },
      CODE,
    ),
    abs(
      1280,
      604,
      240,
      104,
      { alignItems: 'center', justifyContent: 'center', borderRadius: 14, background: copied ? '#22c55e' : '#fad11e', color: '#12072b', fontSize: 28, fontWeight: 800 },
      copied ? 'Copied' : 'Copy',
    ),
    abs(
      400,
      740,
      1120,
      64,
      { alignItems: 'center', gap: 14, paddingLeft: 20, borderRadius: 12, border: '2px solid rgba(245,158,11,0.45)', background: 'rgba(245,158,11,0.10)', color: '#fcd34d', fontSize: 20 },
      warnIcon(),
      'Copy the 16-character code above, not the order number.',
    ),
  ]
}

// ---------- Mail ----------
function mailInbox({ hover }) {
  const rows = [
    ['Eneba', `Your order is complete: ${PRODUCT}`, '10:02 PM', true],
    ['Newsletter', 'Weekly digest: top picks for you', '1h', false],
    ['GitHub', 'Security alert: new sign-in', '3h', false],
    ['Spotify', 'Your daily mix is ready', '5h', false],
  ]
  return [
    abs(162, 152, 260, 866, { background: '#f6f8fc', borderBottomLeftRadius: 18 }),
    abs(182, 176, 214, 54, { alignItems: 'center', paddingLeft: 22, borderRadius: 27, background: '#d3e3fd', color: '#0b1f44', fontSize: 21, fontWeight: 700 }, 'Inbox'),
    ['Starred', 'Sent', 'Drafts'].map((t, i) => abs(204, 254 + i * 50, 200, 30, { color: '#444', fontSize: 20 }, t)),
    rows.map(([from, subject, time, unread], i) =>
      abs(
        440,
        172 + i * 72,
        1300,
        72,
        { alignItems: 'center', paddingLeft: 20, paddingRight: 24, borderBottom: '2px solid #eef0f4', background: i === 0 && hover ? '#eef3fd' : '#fff', fontSize: 20, color: '#1f2937' },
        T(from, { width: 170, fontWeight: unread ? 800 : 400 }),
        T(subject, { fontWeight: unread ? 700 : 400 }),
        T(time, { marginLeft: 'auto', fontWeight: unread ? 700 : 400, color: unread ? '#111' : '#6b7280' }),
      ),
    ),
  ]
}

function mailEmail({ hover }) {
  return [
    abs(162, 152, 260, 866, { background: '#f6f8fc', borderBottomLeftRadius: 18 }),
    abs(182, 176, 214, 54, { alignItems: 'center', paddingLeft: 22, borderRadius: 27, background: '#d3e3fd', color: '#0b1f44', fontSize: 21, fontWeight: 700 }, 'Inbox'),
    ['Starred', 'Sent', 'Drafts'].map((t, i) => abs(204, 254 + i * 50, 200, 30, { color: '#444', fontSize: 20 }, t)),
    abs(460, 176, 1260, 46, { color: '#111', fontSize: 32, fontWeight: 700 }, 'Your order is complete'),
    abs(460, 228, 1260, 30, { color: '#6b7280', fontSize: 19 }, 'Eneba  <no-reply@eneba.com>'),
    abs(
      640,
      282,
      640,
      700,
      { flexDirection: 'column', borderRadius: 16, border: '2px solid #e5e7eb', background: '#fff' },
      h({ height: 104, background: ENEBA_BG, borderTopLeftRadius: 14, borderTopRightRadius: 14, alignItems: 'center', justifyContent: 'center' }, T('eneba', { fontSize: 44, fontWeight: 800, color: '#fff' })),
      h(
        { flexDirection: 'column', gap: 18, padding: '32px 38px' },
        T('Thank you for your purchase!', { fontSize: 28, fontWeight: 700, color: '#111' }),
        T('Your RewUp code is ready. Press "Product details" to reveal it.', { fontSize: 20, color: '#4b5563', lineHeight: 1.45 }),
        h(
          { gap: 16, alignItems: 'center', padding: 16, borderRadius: 12, border: '2px solid #eef0f4' },
          h({ width: 60, height: 76, borderRadius: 8, background: '#0b5cd6', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 800, fontStyle: 'italic' }, 'PayPal'),
          h(
            { flexDirection: 'column', gap: 4 },
            T(PRODUCT, { fontSize: 20, fontWeight: 700, color: '#111' }),
            T(`Qty 1  ·  ${TOTAL}`, { fontSize: 18, color: '#6b7280' }),
          ),
        ),
      ),
    ),
    abs(
      760,
      772,
      400,
      74,
      { alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: hover ? '#6d28d9' : '#7c3aed', color: '#fff', fontSize: 25, fontWeight: 700 },
      'Product details',
    ),
    abs(640, 870, 640, 60, { justifyContent: 'center', alignItems: 'center', color: '#6b7280', fontSize: 18 }, 'Opens your order and shows the RewUp code'),
  ]
}

// ---------- scene states ----------
const SITE_BG = '#202020'
const STEPS = {
  1: { label: 'Open the Rewup payment page', url: 'parforium.net/rewup', bg: SITE_BG },
  2: { label: 'Pick a GBP Value that covers your total', url: 'eneba.com/rewup-rewup-paypal-20-gbp-voucher-global', bg: ENEBA_BG },
  3: { label: 'Press "Buy now" & pay (any method works)', url: 'eneba.com/checkout/payment', bg: ENEBA_BG },
  4: { label: 'Open the Eneba email & press Product details', url: 'mail.google.com', bg: '#ffffff' },
  5: { label: 'Copy your Rewup code', url: 'eneba.com/orders', bg: ENEBA_BG },
  6: { label: 'Paste the code & press Confirm Payment', url: 'parforium.net/rewup', bg: SITE_BG },
  7: { label: 'Order received', url: 'parforium.net/checkout', bg: '#f5f5f5' },
}

const STATES = {
  pay: [1, () => sitePayPage({ hover: false })],
  payHover: [1, () => sitePayPage({ hover: true })],
  e5: [2, () => enebaProduct({ val: 5 })],
  e30: [2, () => enebaProduct({ val: PICK })],
  e30b: [3, () => enebaProduct({ val: PICK })],
  e30bHover: [3, () => enebaProduct({ val: PICK, buyHover: true })],
  co: [3, () => enebaCheckout({})],
  coCard: [3, () => enebaCheckout({ selected: true })],
  coPaid: [3, () => enebaCheckout({ selected: true, paid: true })],
  inbox: [4, () => mailInbox({})],
  inboxHover: [4, () => mailInbox({ hover: true })],
  email: [4, () => mailEmail({})],
  emailHover: [4, () => mailEmail({ hover: true })],
  key: [5, () => enebaKey({})],
  keyCopied: [5, () => enebaKey({ copied: true })],
  code: [6, () => siteCodePage({ typed: '', focused: false })],
  codeHover: [6, () => siteCodePage({ typed: CODE, focused: false, hover: true })],
  thanks: [7, () => siteThanks()],
}
for (let i = 0; i <= CODE.length; i++) STATES[`type${i}`] = [6, () => siteCodePage({ typed: CODE.slice(0, i), focused: true })]

// ---------- timeline ----------
// Each shot: [stateKey, seconds, cursorTo?, opts]. Cursor eases from its previous position to cursorTo.
const P = {
  openBtn: [858, 943],
  val30: [694, 637],
  buy: [1510, 655],
  card: [650, 712],
  pay: [1432, 675],
  mailRow: [1000, 208],
  details: [960, 809],
  copy: [1400, 656],
  input: [960, 470],
  confirm: [960, 803],
}
const typing = Array.from({ length: CODE.length }, (_, i) => [`type${i + 1}`, 0.06])
const SCENES = [
  { start: [1260, 780], shots: [['pay', 0.9], ['pay', 1.2, P.openBtn], ['payHover', 0.9, null, { click: true }]] },
  { start: [760, 330], shots: [['e5', 0.8], ['e5', 1.1, P.val30], ['e30', 1.3, null, { click: true }]] },
  {
    start: P.val30,
    shots: [
      ['e30b', 0.3],
      ['e30b', 1.0, P.buy],
      ['e30bHover', 0.35, null, { click: true }],
      ['co', 0.7, null, { fade: true }],
      ['co', 0.9, P.card],
      ['coCard', 0.35, null, { click: true }],
      ['coCard', 0.9, P.pay],
      ['coPaid', 1.1, null, { click: true }],
    ],
  },
  {
    start: [1300, 560],
    shots: [
      ['inbox', 0.6],
      ['inbox', 0.9, P.mailRow],
      ['inboxHover', 0.35, null, { click: true }],
      ['email', 0.6, [1000, 520], { fade: true }],
      ['email', 0.8, P.details],
      ['emailHover', 0.7, null, { click: true }],
    ],
  },
  { start: [900, 900], shots: [['key', 0.8], ['key', 1.0, P.copy], ['keyCopied', 1.4, null, { click: true }]] },
  {
    start: [1250, 920],
    shots: [
      ['code', 0.5],
      ['code', 0.8, P.input],
      ['type0', 0.3, null, { click: true }],
      ...typing,
      ['type16', 0.5],
      ['type16', 0.8, P.confirm],
      ['codeHover', 0.7, null, { click: true }],
    ],
  },
  { start: P.confirm, shots: [['thanks', 2.8, [1180, 880]]] },
]

const SCENE_FADE = 0.35
const SHOT_FADE = 0.25
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

// ---------- render ----------
async function renderState(key) {
  const [step, build] = STATES[key]
  const s = STEPS[step]
  const svg = await satori(frame({ step, label: s.label, url: s.url, bg: s.bg, content: build() }), { width: W, height: H, fonts })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng()
  return loadImage(png)
}

function drawCursor(ctx, x, y, scale) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, 27)
  ctx.lineTo(7, 21)
  ctx.lineTo(12, 32)
  ctx.lineTo(16.5, 30)
  ctx.lineTo(11.5, 19.5)
  ctx.lineTo(20, 19.5)
  ctx.closePath()
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1.6
  ctx.lineJoin = 'round'
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetY = 2
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.stroke()
  ctx.restore()
}

async function main() {
  const images = {}
  for (const key of Object.keys(STATES)) {
    const started = Date.now()
    images[key] = await renderState(key)
    console.log(`state ${key} ${Date.now() - started}ms`)
    if (process.env.TUTORIAL_STATES_ONLY) fs.writeFileSync(`${PREVIEW_DIR}/${key}.png`, (await (async () => { const c = createCanvas(W, H); c.getContext('2d').drawImage(images[key], 0, 0); return c.toBuffer('image/png') })()))
  }
  if (process.env.TUTORIAL_STATES_ONLY) return
  console.log(`rendered ${Object.keys(images).length} states`)

  // Flatten timeline into absolute shots.
  const shots = []
  let t = 0
  SCENES.forEach((scene, si) => {
    let cur = scene.start
    scene.shots.forEach(([key, dur, to, opts = {}], i) => {
      const from = cur
      const target = to || cur
      shots.push({ key, t0: t, t1: t + dur, from, to: target, scene: si, sceneStart: i === 0, prevKey: i > 0 ? scene.shots[i - 1][0] : null, ...opts })
      cur = target
      t += dur
    })
  })
  const total = t
  const frames = Math.round(total * FPS)
  console.log(`duration ${total.toFixed(2)}s, ${frames} frames`)

  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')
  const prev = createCanvas(W, H)
  const pctx = prev.getContext('2d')

  const composeShot = (c, shot, time) => {
    const local = (time - shot.t0) / (shot.t1 - shot.t0)
    if (shot.fade && shot.prevKey && time - shot.t0 < SHOT_FADE) {
      c.globalAlpha = 1
      c.drawImage(images[shot.prevKey], 0, 0)
      c.globalAlpha = (time - shot.t0) / SHOT_FADE
      c.drawImage(images[shot.key], 0, 0)
      c.globalAlpha = 1
    } else {
      c.drawImage(images[shot.key], 0, 0)
    }
    const e = ease(Math.min(1, Math.max(0, local)))
    const x = shot.from[0] + (shot.to[0] - shot.from[0]) * e
    const y = shot.from[1] + (shot.to[1] - shot.from[1]) * e
    let scale = 1.7
    if (shot.click) {
      const ct = time - shot.t0
      if (ct < 0.5) {
        const p = ct / 0.5
        c.beginPath()
        c.arc(x, y, 12 + p * 46, 0, Math.PI * 2)
        c.fillStyle = `rgba(59,130,246,${0.45 * (1 - p)})`
        c.fill()
        c.lineWidth = 3
        c.strokeStyle = `rgba(59,130,246,${0.8 * (1 - p)})`
        c.stroke()
      }
      if (ct < 0.14) scale = 1.45
    }
    drawCursor(c, x, y, scale)
  }

  if (PREVIEW_DIR) fs.mkdirSync(PREVIEW_DIR, { recursive: true })
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  const ff = spawn(
    ffmpegPath,
    ['-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT],
    { stdio: ['pipe', 'inherit', 'inherit'] },
  )

  let si = 0
  for (let f = 0; f < frames; f++) {
    const time = f / FPS
    while (si < shots.length - 1 && time >= shots[si].t1) si++
    const shot = shots[si]
    composeShot(ctx, shot, time)

    if (shot.sceneStart && shot.scene > 0 && time - shot.t0 < SCENE_FADE) {
      const before = shots[si - 1]
      composeShot(pctx, before, before.t1 - 0.001)
      const a = (time - shot.t0) / SCENE_FADE
      const tmp = ctx.getImageData(0, 0, W, H)
      pctx.globalAlpha = 1
      const cur = createCanvas(W, H)
      cur.getContext('2d').putImageData(tmp, 0, 0)
      pctx.globalAlpha = a
      pctx.drawImage(cur, 0, 0)
      pctx.globalAlpha = 1
      ctx.drawImage(prev, 0, 0)
    }

    if (PREVIEW_DIR && shot.sceneStart === false && Math.abs(time - (shot.t0 + shot.t1) / 2) < 0.5 / FPS) {
      fs.writeFileSync(path.join(PREVIEW_DIR, `f${String(f).padStart(4, '0')}.png`), canvas.toBuffer('image/png'))
    }

    const buf = Buffer.from(ctx.getImageData(0, 0, W, H).data.buffer)
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r))
  }
  ff.stdin.end()
  await new Promise((r, j) => ff.on('close', (code) => (code === 0 ? r() : j(new Error(`ffmpeg exited ${code}`)))))
  console.log(`wrote ${OUT} (${(fs.statSync(OUT).size / 1e6).toFixed(2)} MB)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
