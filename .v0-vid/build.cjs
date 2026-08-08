/* Rebuild the Rewarble tutorial walkthrough to match the CURRENT site.
   Generates a framed poster per step (dark canvas + browser window + step pill),
   then composites them into a video with crossfades via ffmpeg. */
const sharp = require('sharp');
const ffmpeg = require('ffmpeg-static');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIR = path.join(process.cwd(), '.v0-vid');
const CAP = path.join(DIR, 'cap');
const OUT = path.join(DIR, 'seg');
fs.mkdirSync(OUT, { recursive: true });

const W = 1920, H = 1080;
const CANVAS = { r: 10, g: 15, b: 23 }; // #0A0F17
const WIN = { x: 260, y: 118, w: 1400, h: 922, tb: 52, radius: 16 };
const CONTENT = { x: WIN.x, y: WIN.y + WIN.tb, w: WIN.w, h: WIN.h - WIN.tb };

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// Fit an image buffer inside CONTENT on a white background, preserving aspect.
async function fitContent(input, crop) {
  let img = sharp(input);
  if (crop) img = img.extract(crop);
  const buf = await img.resize(CONTENT.w, CONTENT.h, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
  return buf;
}

// Browser-window chrome overlay (transparent, drawn on top): rounded border + titlebar + dots. No URL bar.
function chromeSVG() {
  const { x, y, w, h, tb, radius } = WIN;
  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="tb"><path d="M ${x} ${y + radius} q 0 ${-radius} ${radius} ${-radius} h ${w - 2 * radius} q ${radius} 0 ${radius} ${radius} v ${tb - radius} h ${-w} z"/></clipPath></defs>
    <g clip-path="url(#tb)"><rect x="${x}" y="${y}" width="${w}" height="${tb}" fill="#1b2230"/></g>
    <circle cx="${x + 26}" cy="${y + tb / 2}" r="7" fill="#ff5f57"/>
    <circle cx="${x + 50}" cy="${y + tb / 2}" r="7" fill="#febc2e"/>
    <circle cx="${x + 74}" cy="${y + tb / 2}" r="7" fill="#28c840"/>
    <rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="${radius}" ry="${radius}" fill="none" stroke="#2a3446" stroke-width="1.5"/>
  </svg>`);
}

// Step pill (top-left, overlapping above the window).
function pillSVG(num, label, done) {
  const padX = 22, circleR = 17, gap = 14, fontSize = 26;
  const charW = fontSize * 0.56;
  const textW = Math.ceil(label.length * charW);
  const pw = padX + circleR * 2 + gap + textW + padX;
  const ph = 52;
  const accent = '#7C3AED';
  const numTxt = done ? '\u2713' : String(num);
  return { w: pw, h: ph, buf: Buffer.from(`<svg width="${pw}" height="${ph}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${pw}" height="${ph}" rx="${ph / 2}" ry="${ph / 2}" fill="#141a24" stroke="#2a3446" stroke-width="1.5"/>
    <circle cx="${padX + circleR}" cy="${ph / 2}" r="${circleR}" fill="${accent}"/>
    <text x="${padX + circleR}" y="${ph / 2}" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${numTxt}</text>
    <text x="${padX + circleR * 2 + gap}" y="${ph / 2 + 1}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="600" fill="#f4f6fb" dominant-baseline="central">${esc(label)}</text>
  </svg>`) };
}

async function buildPoster(file, { image, crop, num, label, done }) {
  const bg = sharp({ create: { width: W, height: H, channels: 4, background: CANVAS } });
  const content = await fitContent(image, crop);
  const pill = pillSVG(num, label, done);
  await bg.composite([
    { input: content, left: CONTENT.x, top: CONTENT.y },
    { input: chromeSVG(), left: 0, top: 0 },
    { input: pill.buf, left: WIN.x - 6, top: WIN.y - Math.round(pill.h / 2) },
  ]).png().toFile(file);
  return file;
}

// G2A frames are 1920x1080; crop out the light page content (below chrome, excludes original pill/url bar).
const G2A_CROP = { left: 150, top: 122, width: 1630, height: 900 };

const STEPS = [
  { key: 'p1', image: `${CAP}/rewarble.png`,      crop: { left: 60, top: 340, width: 1060, height: 1160 }, num: 1, label: 'Open the Rewarble payment page' },
  { key: 'p2', image: `${CAP}/g2a_listing.png`,   crop: G2A_CROP, num: 2, label: 'Buy your Rewarble card on G2A' },
  { key: 'p3', image: `${CAP}/g2a_checkout.png`,  crop: G2A_CROP, num: 3, label: 'Pay on G2A \u2014 any method works' },
  { key: 'p4', image: `${CAP}/g2a_code.png`,      crop: G2A_CROP, num: 4, label: 'Copy your gift-card code' },
  { key: 'p5', image: `${CAP}/rewarble.png`,      crop: { left: 60, top: 1520, width: 1060, height: 575 }, num: 5, label: 'Paste the code & confirm' },
  { key: 'p6', image: `${CAP}/received.png`,      crop: { left: 60, top: 300, width: 1060, height: 900 }, num: 6, label: 'Order received', done: true },
];

const DUR = [6.5, 5.0, 4.5, 5.0, 6.0, 4.0];
const T = 0.5; // crossfade duration
const FPS = 30;

(async () => {
  // 1) posters
  for (const s of STEPS) {
    await buildPoster(`${OUT}/${s.key}.png`, s);
    console.log('poster', s.key);
  }
  // 2) per-segment mp4 (static)
  STEPS.forEach((s, i) => {
    execFileSync(ffmpeg, ['-y', '-loop', '1', '-t', String(DUR[i]), '-i', `${OUT}/${s.key}.png`,
      '-vf', `fps=${FPS},format=yuv420p`, '-c:v', 'libx264', '-preset', 'medium', `${OUT}/${s.key}.mp4`], { stdio: 'ignore' });
    console.log('seg', s.key);
  });
  // 3) xfade chain
  const inputs = [];
  STEPS.forEach(s => { inputs.push('-i', `${OUT}/${s.key}.mp4`); });
  let filt = '';
  let prev = '0:v';
  let L = DUR[0];
  for (let k = 1; k < STEPS.length; k++) {
    const off = (L - T).toFixed(3);
    const out = (k === STEPS.length - 1) ? 'vout' : `v${k}`;
    filt += `[${prev}][${k}:v]xfade=transition=fade:duration=${T}:offset=${off}[${out}];`;
    prev = out;
    L = L + DUR[k] - T;
  }
  filt = filt.replace(/;$/, '');
  const total = L.toFixed(2);
  execFileSync(ffmpeg, ['-y', ...inputs, '-filter_complex', filt, '-map', '[vout]',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    `${DIR}/new-tutorial.mp4`], { stdio: 'ignore' });
  console.log('DONE total ~', total, 's');
})();
