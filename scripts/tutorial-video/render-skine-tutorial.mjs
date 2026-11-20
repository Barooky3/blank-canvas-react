// Renders public/videos/checkout-tutorial-skine.mp4 — the card tutorial shown on
// the checkout page. Same visual style as the Eneba tutorial, but it walks
// through the real Skine Rewarble gift card flow (Buy Now -> Mastercard/Visa ->
// email + Checkout -> code arrives by email).
//
// Tooling lives outside the repo (installed into /tmp/ff):
//   npm i --prefix /tmp/ff satori@0.10 @resvg/resvg-js @napi-rs/canvas @fontsource/inter ffmpeg-static
//   node scripts/tutorial-video/render-skine-tutorial.mjs
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
const OUT = path.resolve(process.argv[2] || 'public/videos/checkout-tutorial-skine.mp4')
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
    abs(560, 176, 800, 60, { justifyContent: 'center', color: '#f5f5f5', fontSize: 44, fontWeight: 700 }, 'Pay with Card'),
    abs(
      580,
      256,
      760,
      128,
      { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 16, border: '2px solid rgba(124,58,237,0.5)', background: 'rgba(124,58,237,0.13)' },
      T('Order amount', { fontSize: 22, color: '#a3a3a3' }),
      T('€28.50', { fontSize: 56, fontWeight: 700, color: '#fff' }),
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
          T('Buy a Rewarble gift card on Skine', { fontSize: 25, fontWeight: 700, color: '#fff' }),
          T('Your cart total is €28.50. Open Skine and press "Buy Now" on a card value that covers your total (here: €30).', {
            fontSize: 20,
            color: '#a8a8a8',
            lineHeight: 1.45,
          }),
          h(
            { gap: 10, flexWrap: 'wrap' },
            ['Visa', 'Mastercard'].map((c) =>
              h({ padding: '6px 12px', borderRadius: 8, background: '#363636', color: '#c4c4c4', fontSize: 17 }, c),
            ),
          ),
          h(
            { padding: '12px 16px', borderRadius: 10, border: '2px solid rgba(14,165,233,0.4)', background: 'rgba(14,165,233,0.10)', color: '#7dd3fc', fontSize: 18, lineHeight: 1.4 },
            'At Skine checkout choose "Mastercard / Visa" as the payment method. Your code is emailed to you instantly.',
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
      'Open Skine',
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
      T('€28.50', { fontSize: 46, fontWeight: 700, color: '#fff' }),
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
    abs(612, 398, 600, 28, { fontSize: 18, fontWeight: 600, letterSpacing: 2, color: '#a3a3a3' }, 'REWARBLE CODE'),
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
      T('Send the Rewarble code, not the order number', { fontSize: 19, fontWeight: 700, color: '#fcd34d' }),
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

// ---------- Skine (dark navy) ----------
const SKINE_BG = '#050b14'
const card = { borderRadius: 10, background: '#0f2236' }
const SKINE_BTN = '#1f4b7a'

const skineLogo = (x, y) =>
  abs(
    x,
    y,
    null,
    48,
    { alignItems: 'center', gap: 12 },
    svgImg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 44"><path d="M4 2 L38 22 L4 42 Z" fill="#2b7de9" stroke="#2b7de9" stroke-width="4" stroke-linejoin="round"/></svg>', 40),
    T('SKINE', { fontSize: 38, fontWeight: 800, color: '#fff', letterSpacing: 1 }),
  )

const skineHeader = () =>
  abs(
    162,
    152,
    1596,
    90,
    { background: SKINE_BG, alignItems: 'center', paddingLeft: 60, paddingRight: 60 },
    skineLogo(60, 21),
    h({ marginLeft: 'auto', width: 560, height: 50, borderRadius: 6, background: '#0f1a2a', alignItems: 'center', paddingLeft: 22, color: '#8b95a7', fontSize: 19 }, 'Search products...'),
    h({ marginLeft: 30, padding: '8px 14px', borderRadius: 6, background: '#0f1a2a', color: '#fff', fontSize: 17, fontWeight: 600 }, 'English  ·  EUR (€)'),
  )

const rLogo = (x, y, size) =>
  abs(x, y, size, size, { alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: '#16213a', color: '#fff', fontSize: size * 0.55, fontWeight: 900 }, 'R')

const SKINE_VALUES = [
  [10, '24%'],
  [20, '14%'],
  [30, '11%'],
  [50, '8%'],
  [100, '6%'],
]

function skineProduct({ hoverVal }) {
  return [
    skineHeader(),
    abs(222, 262, 900, 52, { color: '#fff', fontSize: 40, fontWeight: 700 }, 'Rewarble gift card'),
    abs(222, 318, 1200, 30, { color: '#c8d1df', fontSize: 20 }, 'Instant PayPal funds, virtual cards, and 100+ ways to spend your Rewarble gift card'),
    SKINE_VALUES.map(([v, fee], i) => {
      const hov = v === hoverVal
      const y = 376 + i * 118
      return [
        abs(222, y, 1060, 102, { ...card, border: hov ? '2px solid #2b7de9' : '2px solid #0f2236' }),
        rLogo(252, y + 18, 66),
        abs(342, y + 20, 500, 30, { color: '#fff', fontSize: 21, fontWeight: 700 }, `Rewarble gift card - €${v}`),
        abs(342, y + 54, 500, 28, { color: '#9fb0c6', fontSize: 18 }, `${fee} Service Fee`),
        abs(900, y + 30, 100, 40, { color: '#fff', fontSize: 28, fontWeight: 700 }, `€${v}`),
        abs(
          1020,
          y + 24,
          230,
          54,
          { alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: hov ? '#2b7de9' : SKINE_BTN, color: '#fff', fontSize: 21, fontWeight: 700 },
          'Buy Now',
        ),
      ]
    }),
    abs(1320, 376, 400, 230, { ...card, flexDirection: 'column', gap: 12, padding: '24px 26px' }, T('Secure Payment', { color: '#fff', fontSize: 22, fontWeight: 700 }), T('Complete the checkout safely with a choice of 70+ payment methods.', { color: '#c8d1df', fontSize: 18, lineHeight: 1.4 })),
    abs(
      1320,
      628,
      400,
      150,
      { flexDirection: 'column', gap: 10, padding: '20px 24px', borderRadius: 10, border: '2px solid rgba(14,165,233,0.45)', background: 'rgba(14,165,233,0.12)' },
      T('Tip', { color: '#7dd3fc', fontSize: 20, fontWeight: 700 }),
      T('Pick the card value that covers your Parforium total.', { color: '#bae6fd', fontSize: 18, lineHeight: 1.4 }),
    ),
  ]
}

const summary = ({ withTx }) => [
  abs(1150, 262, 570, 150, card),
  rLogo(1176, 288, 96),
  abs(1292, 290, 400, 30, { color: '#fff', fontSize: 22, fontWeight: 700 }, 'Rewarble gift card - €30'),
  abs(1292, 326, 400, 28, { color: '#9fb0c6', fontSize: 18 }, '11% Service Fee  ·  EUR'),
  abs(1640, 360, 60, 30, { color: '#fff', fontSize: 24, fontWeight: 700 }, '€30'),
  abs(
    1150,
    432,
    570,
    withTx ? 200 : 164,
    { ...card, flexDirection: 'column', gap: 10, padding: '24px 28px' },
    h({ justifyContent: 'space-between', color: '#fff', fontSize: 20, fontWeight: 600 }, T('Subtotal'), T('€30.00')),
    h({ justifyContent: 'space-between', color: '#c8d1df', fontSize: 19 }, T('Skine service costs'), T('€3.30')),
    withTx ? h({ justifyContent: 'space-between', color: '#c8d1df', fontSize: 19 }, T('Transaction costs'), T('€2.25')) : null,
    h({ height: 2, background: '#2a3d55', marginTop: 4 }),
    h({ justifyContent: 'space-between', color: '#fff', fontSize: 24, fontWeight: 700 }, T('Total'), T(withTx ? '€35.55' : '€33.30')),
  ),
]

function skineMethods({ hover }) {
  const methods = ['iDeal', 'PayPal', 'Mastercard / Visa', 'Bancontact', 'Skrill', 'EPS']
  return [
    skineHeader(),
    abs(200, 262, 800, 40, { color: '#fff', fontSize: 28, fontWeight: 700 }, 'Select Payment Method'),
    methods.map((m, i) => {
      const isCard = m === 'Mastercard / Visa'
      const hov = isCard && hover
      return abs(
        200,
        322 + i * 92,
        900,
        76,
        { ...card, alignItems: 'center', gap: 18, paddingLeft: 22, paddingRight: 22, border: hov ? '2px solid #2b7de9' : isCard ? '2px solid #2a4a6e' : '2px solid #0f2236' },
        h({ width: 26, height: 26, borderRadius: 13, border: `2px solid ${hov ? '#2b7de9' : '#9fb0c6'}` }),
        T(m, { fontSize: 22, fontWeight: 700, color: '#fff' }),
        isCard ? h({ padding: '4px 10px', borderRadius: 6, background: '#fff', color: '#1a1f71', fontSize: 15, fontWeight: 800 }, 'VISA  ·  MC') : null,
        T('Fees', { marginLeft: 'auto', color: '#9fb0c6', fontSize: 16 }),
      )
    }),
    summary({ withTx: false }),
  ]
}

function skineEmailStep({ typed, captcha, hover }) {
  const email = 'you@example.com'
  return [
    skineHeader(),
    abs(
      200,
      262,
      900,
      70,
      { ...card, alignItems: 'center', gap: 16, paddingLeft: 26, paddingRight: 26 },
      h({ padding: '4px 10px', borderRadius: 6, background: '#fff', color: '#1a1f71', fontSize: 15, fontWeight: 800 }, 'VISA  ·  MC'),
      T('Mastercard', { fontSize: 22, fontWeight: 700, color: '#fff' }),
      T('Change', { marginLeft: 'auto', color: '#5aa2f5', fontSize: 18 }),
    ),
    abs(200, 352, 900, 420, { ...card, flexDirection: 'column', gap: 14, padding: '28px 30px' },
      T('Email Address', { color: '#fff', fontSize: 23, fontWeight: 700 }),
      T('Your Rewarble code will be sent to this email.', { color: '#c8d1df', fontSize: 18 }),
      h(
        { height: 64, borderRadius: 6, border: '2px solid #2b7de9', background: '#0a1726', alignItems: 'center', paddingLeft: 20, color: '#fff', fontSize: 23 },
        email.slice(0, typed),
      ),
      h(
        { width: 360, height: 84, marginTop: 6, alignSelf: 'center', borderRadius: 4, border: '2px solid #3a3a3a', background: '#222', alignItems: 'center', paddingLeft: 18, gap: 16 },
        h(
          { width: 34, height: 34, borderRadius: 3, border: captcha ? '0px solid #fff' : '2px solid #c1c1c1', background: captcha ? '#22c55e' : '#fff', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 800 },
          captcha ? '✓' : '',
        ),
        T("I'm not a robot", { color: '#e5e5e5', fontSize: 20 }),
      ),
      h(
        { height: 62, marginTop: 10, borderRadius: 6, background: hover ? '#2b7de9' : SKINE_BTN, alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 700 },
        'Checkout',
      ),
    ),
    summary({ withTx: true }),
  ]
}

function skinePay({ filled, paid }) {
  const field = (label, value, w) =>
    h(
      { flexDirection: 'column', gap: 8, width: w },
      T(label, { color: '#374151', fontSize: 18, fontWeight: 600 }),
      h({ height: 60, borderRadius: 8, border: '2px solid #d1d5db', background: '#fff', alignItems: 'center', paddingLeft: 18, color: '#111', fontSize: 22, letterSpacing: 1 }, filled ? value : ''),
    )
  return [
    abs(162, 152, 1596, 866, { background: '#f3f4f6', borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }),
    abs(
      560,
      210,
      800,
      760,
      { flexDirection: 'column', gap: 22, padding: '40px 48px', borderRadius: 18, background: '#fff', border: '2px solid #e5e7eb' },
      h({ justifyContent: 'space-between', alignItems: 'center' }, T('Skine B.V.', { fontSize: 24, fontWeight: 700, color: '#111' }), T('€35.55', { fontSize: 30, fontWeight: 800, color: '#111' })),
      T('Pay with card', { fontSize: 20, color: '#6b7280' }),
      field('Card number', '4242 4242 4242 4242', 704),
      h({ gap: 24 }, field('Expiry', '08 / 29', 340), field('CVC', '123', 340)),
      field('Name on card', 'Your Name', 704),
      h(
        { height: 70, marginTop: 10, borderRadius: 10, background: paid ? '#16a34a' : '#111827', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700 },
        paid ? 'Payment successful' : 'Pay €35.55',
      ),
    ),
  ]
}

// ---------- Mail ----------
const mailSidebar = () => [
  abs(162, 152, 260, 866, { background: '#f6f8fc', borderBottomLeftRadius: 18 }),
  abs(182, 176, 214, 54, { alignItems: 'center', paddingLeft: 22, borderRadius: 27, background: '#d3e3fd', color: '#0b1f44', fontSize: 21, fontWeight: 700 }, 'Inbox'),
  ['Starred', 'Sent', 'Drafts'].map((t, i) => abs(204, 254 + i * 50, 200, 30, { color: '#444', fontSize: 20 }, t)),
]

function mailInbox({ hover }) {
  const rows = [
    ['Skine', 'Your Rewarble gift card - €30 code', '10:02 PM', true],
    ['Newsletter', 'Weekly digest: top picks for you', '1h', false],
    ['GitHub', 'Security alert: new sign-in', '3h', false],
    ['Spotify', 'Your daily mix is ready', '5h', false],
  ]
  return [
    mailSidebar(),
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

function mailEmail({ copied }) {
  return [
    mailSidebar(),
    abs(460, 176, 1260, 46, { color: '#111', fontSize: 32, fontWeight: 700 }, 'Your Rewarble gift card - €30 code'),
    abs(460, 228, 1260, 30, { color: '#6b7280', fontSize: 19 }, 'Skine  <noreply@skine.com>'),
    abs(
      600,
      282,
      720,
      700,
      { flexDirection: 'column', borderRadius: 16, border: '2px solid #e5e7eb', background: '#fff' },
      h({ height: 104, background: SKINE_BG, borderTopLeftRadius: 14, borderTopRightRadius: 14, alignItems: 'center', justifyContent: 'center' }, T('SKINE', { fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: 1 })),
      h(
        { flexDirection: 'column', gap: 18, padding: '32px 38px' },
        T('Thank you for your purchase!', { fontSize: 28, fontWeight: 700, color: '#111' }),
        T('Order number: 4417 2093 (this is NOT your code)', { fontSize: 18, color: '#6b7280' }),
        T('YOUR REWARBLE CODE', { fontSize: 18, fontWeight: 700, letterSpacing: 2, color: '#374151', marginTop: 8 }),
        h(
          { gap: 14 },
          h({ width: 470, height: 86, borderRadius: 12, border: '3px solid #2b7de9', background: '#f1f6fd', alignItems: 'center', paddingLeft: 22, color: '#111', fontSize: 31, fontWeight: 700, letterSpacing: 2 }, CODE),
          h({ width: 160, height: 86, borderRadius: 12, background: copied ? '#16a34a' : '#2b7de9', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700 }, copied ? 'Copied' : 'Copy'),
        ),
        h(
          { alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 10, border: '2px solid rgba(245,158,11,0.5)', background: '#fffbeb', color: '#92400e', fontSize: 18 },
          warnIcon(),
          'Copy the 16-character code, not the order number.',
        ),
      ),
    ),
  ]
}

// ---------- scene states ----------
const SITE_BG = '#202020'
const STEPS = {
  1: { label: 'Open the card payment page', url: 'parfora.eu/card', bg: SITE_BG },
  2: { label: 'Press "Buy Now" on a value that covers your total', url: 'skine.com/en-ie/rewarble', bg: SKINE_BG },
  3: { label: 'Choose "Mastercard / Visa"', url: 'skine.com/en-ie/checkout', bg: SKINE_BG },
  4: { label: 'Enter your email & press Checkout', url: 'skine.com/en-ie/checkout', bg: SKINE_BG },
  5: { label: 'Pay with your card', url: 'checkout.skine.com/pay', bg: '#f3f4f6' },
  6: { label: 'Copy the code from the Skine email', url: 'mail.google.com', bg: '#ffffff' },
  7: { label: 'Paste the code & press Confirm Payment', url: 'parfora.eu/card', bg: SITE_BG },
  8: { label: 'Order received', url: 'parfora.eu/checkout', bg: '#f5f5f5' },
}

const EMAIL_LEN = 'you@example.com'.length
const STATES = {
  pay: [1, () => sitePayPage({ hover: false })],
  payHover: [1, () => sitePayPage({ hover: true })],
  prod: [2, () => skineProduct({})],
  prodHover: [2, () => skineProduct({ hoverVal: 30 })],
  methods: [3, () => skineMethods({})],
  methodsHover: [3, () => skineMethods({ hover: true })],
  emailCaptcha: [4, () => skineEmailStep({ typed: EMAIL_LEN, captcha: true })],
  emailHover: [4, () => skineEmailStep({ typed: EMAIL_LEN, captcha: true, hover: true })],
  payForm: [5, () => skinePay({})],
  payFilled: [5, () => skinePay({ filled: true })],
  payPaid: [5, () => skinePay({ filled: true, paid: true })],
  inbox: [6, () => mailInbox({})],
  inboxHover: [6, () => mailInbox({ hover: true })],
  email: [6, () => mailEmail({})],
  emailCopied: [6, () => mailEmail({ copied: true })],
  code: [7, () => siteCodePage({ typed: '', focused: false })],
  codeHover: [7, () => siteCodePage({ typed: CODE, focused: false, hover: true })],
  thanks: [8, () => siteThanks()],
}
for (let i = 0; i <= EMAIL_LEN; i += 3) STATES[`mail${i}`] = [4, () => skineEmailStep({ typed: i })]
STATES[`mail${EMAIL_LEN}`] = [4, () => skineEmailStep({ typed: EMAIL_LEN })]
for (let i = 0; i <= CODE.length; i++) STATES[`type${i}`] = [7, () => siteCodePage({ typed: CODE.slice(0, i), focused: true })]

// ---------- timeline ----------
const P = {
  openBtn: [858, 943],
  buy30: [1135, 662],
  cardMethod: [600, 544],
  emailInput: [650, 470],
  captcha: [690, 584],
  checkout: [650, 685],
  payBtn: [960, 870],
  mailRow: [1000, 208],
  copy: [1180, 586],
  input: [960, 470],
  confirm: [960, 803],
}
const mailTyping = []
for (let i = 3; i < EMAIL_LEN; i += 3) mailTyping.push([`mail${i}`, 0.08])
mailTyping.push([`mail${EMAIL_LEN}`, 0.3])
const typing = Array.from({ length: CODE.length }, (_, i) => [`type${i + 1}`, 0.06])
const SCENES = [
  { start: [1260, 780], shots: [['pay', 0.9], ['pay', 1.2, P.openBtn], ['payHover', 0.9, null, { click: true }]] },
  { start: [760, 330], shots: [['prod', 0.8], ['prod', 1.2, P.buy30], ['prodHover', 1.0, null, { click: true }]] },
  { start: P.buy30, shots: [['methods', 0.6], ['methods', 1.1, P.cardMethod], ['methodsHover', 0.9, null, { click: true }]] },
  {
    start: P.cardMethod,
    shots: [
      ['mail0', 0.4],
      ['mail0', 0.7, P.emailInput],
      ['mail0', 0.2, null, { click: true }],
      ...mailTyping,
      [`mail${EMAIL_LEN}`, 0.7, P.captcha],
      ['emailCaptcha', 0.6, null, { click: true }],
      ['emailCaptcha', 0.7, P.checkout],
      ['emailHover', 0.8, null, { click: true }],
    ],
  },
  {
    start: [960, 600],
    shots: [
      ['payForm', 0.7],
      ['payFilled', 0.9, null, { fade: true }],
      ['payFilled', 0.8, P.payBtn],
      ['payPaid', 1.1, null, { click: true }],
    ],
  },
  {
    start: [1300, 560],
    shots: [
      ['inbox', 0.6],
      ['inbox', 0.9, P.mailRow],
      ['inboxHover', 0.35, null, { click: true }],
      ['email', 0.8, [1000, 520], { fade: true }],
      ['email', 0.9, P.copy],
      ['emailCopied', 1.3, null, { click: true }],
    ],
  },
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
