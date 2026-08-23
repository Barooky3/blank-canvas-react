const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ffmpeg = require('ffmpeg-static');
const { execFileSync } = require('child_process');

const DIR = __dirname;
const CAP = path.join(DIR, 'cap');
const SEG = path.join(DIR, 'seg');
fs.mkdirSync(SEG, { recursive: true });

const W = 1920, H = 1080;
const PURPLE = '#7C3AED';

// window geometry
const winX = 160, winY = 150, winW = 1600, titleH = 46, contentH = 846;
const contentX = winX, contentY = winY + titleH, contentW = winW;

const FONT_BOLD = fs.readFileSync(path.join(DIR, 'fonts', 'DejaVuSans-Bold.ttf')).toString('base64');
const FONT_FACE = `<style>@font-face{font-family:'DVB';src:url('data:font/ttf;base64,${FONT_BOLD}');}</style>`;

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// ---- window chrome (title bar + traffic lights + frame), rendered once ----
function windowSvg(bg) {
  const r = 16;
  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="34" flood-color="#000" flood-opacity="0.55"/>
    </filter></defs>
    <rect x="${winX}" y="${winY}" width="${winW}" height="${titleH + contentH}" rx="${r}" ry="${r}" fill="#0d1220" filter="url(#sh)"/>
    <rect x="${winX}" y="${winY}" width="${winW}" height="${titleH}" fill="#1b2231"/>
    <rect x="${winX}" y="${winY + titleH}" width="${winW}" height="${contentH}" fill="${bg}"/>
    <rect x="${winX}" y="${winY}" width="${winW}" height="${titleH + contentH}" rx="${r}" ry="${r}" fill="none" stroke="#2a3446" stroke-width="1.5"/>
    <circle cx="${winX + 26}" cy="${winY + titleH / 2}" r="7" fill="#ff5f57"/>
    <circle cx="${winX + 50}" cy="${winY + titleH / 2}" r="7" fill="#febc2e"/>
    <circle cx="${winX + 74}" cy="${winY + titleH / 2}" r="7" fill="#28c840"/>
  </svg>`);
}

function pillSvg(num, label) {
  const padX = 24, circleR = 18, gap = 15, fontSize = 27;
  const charW = fontSize * 0.60;
  const textW = label.length * charW;
  const pw = Math.round(padX + circleR * 2 + gap + textW + padX);
  const ph = 60;
  return { w: pw, h: ph, buf: Buffer.from(`<svg width="${pw}" height="${ph}" xmlns="http://www.w3.org/2000/svg">
    ${FONT_FACE}
    <rect x="0" y="0" width="${pw}" height="${ph}" rx="${ph / 2}" ry="${ph / 2}" fill="#141a24" stroke="#2a3446" stroke-width="1.5"/>
    <circle cx="${padX + circleR}" cy="${ph / 2}" r="${circleR}" fill="${PURPLE}"/>
    <text x="${padX + circleR}" y="${ph / 2 + 1}" font-family="DVB" font-size="23" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${num}</text>
    <text x="${padX + circleR * 2 + gap}" y="${ph / 2 + 1}" font-family="DVB" font-size="${fontSize}" fill="#f4f6fb" dominant-baseline="central">${esc(label)}</text>
  </svg>`) };
}

const segments = [
  { key: 'p1', image: 'e_listing.png', crop: { left: 18, top: 0, width: 1244, height: 640 }, bg: '#3a1d8a', num: '1', label: 'Open the Rewarble voucher on Eneba' },
  { key: 'p2', image: 'e_values.png',  crop: { left: 20, top: 298, width: 900, height: 470 }, bg: '#2a1f57', num: '2', label: 'Pick a value that covers your total' },
  { key: 'p3', image: 'e_listing.png', crop: { left: 892, top: 268, width: 350, height: 372 }, bg: '#2a1f57', num: '3', label: 'Buy now & pay your way' },
  { key: 'p4', image: 'e_email.png',   crop: { left: 272, top: 14, width: 636, height: 596 }, bg: '#eef0f3', num: '4', label: 'Get your Rewarble code by email' },
  { key: 'p5', image: 's_full.png',    crop: { left: 128, top: 1795, width: 924, height: 610 }, bg: '#faf7f5', num: '5', label: 'Paste the code & confirm' },
  { key: 'p6', image: 's_received.png',crop: { left: 166, top: 300, width: 848, height: 770 }, bg: '#faf7f5', num: '\u2713', label: 'Order received' },
];

async function buildPoster(s) {
  const src = path.join(CAP, s.image);
  // crop then contain-fit into content area with small inset
  const inset = 26;
  const cw = contentW - inset * 2, ch = contentH - inset * 2;
  const cropped = await sharp(src).extract(s.crop)
    .resize(cw, ch, { fit: 'inside', withoutEnlargement: false })
    .toBuffer();
  const meta = await sharp(cropped).metadata();
  const cx = contentX + Math.round((contentW - meta.width) / 2);
  const cy = contentY + Math.round((contentH - meta.height) / 2);

  const pill = pillSvg(s.num, s.label);
  const base = sharp({ create: { width: W, height: H, channels: 4, background: '#0A0F17' } });
  const out = await base.composite([
    { input: windowSvg(s.bg), top: 0, left: 0 },
    { input: cropped, top: cy, left: cx },
    { input: pill.buf, top: 70, left: winX },
  ]).png().toBuffer();
  const posterPath = path.join(SEG, s.key + '.png');
  fs.writeFileSync(posterPath, out);
  return posterPath;
}

(async () => {
  const posters = [];
  for (const s of segments) posters.push(await buildPoster(s));
  console.log('posters built:', posters.length);

  // per-segment clips with gentle zoom
  const dur = 4.6, fps = 30;
  const clips = [];
  posters.forEach((p, i) => {
    const clip = path.join(SEG, 'c' + i + '.mp4');
    const frames = Math.round(dur * fps);
    execFileSync(ffmpeg, ['-y', '-loop', '1', '-i', p,
      '-vf', `scale=${W}:${H},zoompan=z='min(zoom+0.00035,1.06)':d=${frames}:s=${W}x${H}:fps=${fps}`,
      '-t', String(dur), '-r', String(fps), '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
      clip], { stdio: 'ignore' });
    clips.push(clip);
  });
  console.log('clips built:', clips.length);

  // xfade chain
  const xf = 0.5;
  const inputs = [];
  clips.forEach(c => { inputs.push('-i', c); });
  let fil16 = '';
  let prev = '[0:v]';
  let offset = dur - xf;
  for (let i = 1; i < clips.length; i++) {
    const out = (i === clips.length - 1) ? '[v]' : `[x${i}]`;
    fil16 += `${prev}[${i}:v]xfade=transition=fade:duration=${xf}:offset=${offset.toFixed(3)}${out};`;
    prev = out;
    offset += dur - xf;
  }
  fil16 = fil16.replace(/;$/, '');
  const outPath = path.join(DIR, 'new-tutorial.mp4');
  execFileSync(ffmpeg, [...inputs, '-filter_complex', fil16, '-map', '[v]',
    '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-movflags', '+faststart',
    outPath], { stdio: 'inherit' });
  console.log('done:', outPath);
})();
