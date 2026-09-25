/**
 * Generates favicons, app icons and social preview images.
 *   npm run assets
 * Outputs are committed, so this only needs re-running when the artwork changes.
 */
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import qrcode from "qrcode-generator";
import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = (p) => join(root, p);

for (const f of ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]) {
  if (existsSync(f)) GlobalFonts.registerFromPath(f);
}
const FONT = "DejaVu Sans, Helvetica, Arial, sans-serif";

// ---------------------------------------------------------------------------
// Logo: three QR "eyes" + a play button, on a violet→pink gradient.
// ---------------------------------------------------------------------------

function logoSvg({ padded = false } = {}) {
  // Maskable icons need the artwork inside the central 80% safe zone.
  const s = padded ? 0.72 : 1;
  const o = (64 - 64 * s) / 2;
  const eye = (x, y) =>
    `<rect x="${x + 2}" y="${y + 2}" width="14" height="14" rx="4.5" fill="none" stroke="#fff" stroke-width="4"/>` +
    `<rect x="${x + 6.5}" y="${y + 6.5}" width="5" height="5" rx="1.5" fill="#fff"/>`;
  const bg = padded
    ? `<rect width="64" height="64" fill="url(#g)"/>`
    : `<rect width="64" height="64" rx="14" fill="url(#g)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#db2777"/></linearGradient></defs>
${bg}
<g transform="translate(${o} ${o}) scale(${s})">
${eye(8, 8)}${eye(38, 8)}${eye(8, 38)}
<rect x="30" y="30" width="4" height="4" rx="1" fill="#fff" opacity=".85"/>
<rect x="30" y="16" width="4" height="4" rx="1" fill="#fff" opacity=".85"/>
<rect x="16" y="30" width="4" height="4" rx="1" fill="#fff" opacity=".85"/>
<path d="M41 37.5v17a1.6 1.6 0 0 0 2.4 1.4l13.6-8.5a1.6 1.6 0 0 0 0-2.8L43.4 36.1a1.6 1.6 0 0 0-2.4 1.4z" fill="#fff"/>
</g>
</svg>
`;
}

async function png(svg, size, file) {
  const img = await loadImage(Buffer.from(svg.replace('width="64" height="64"', `width="${size}" height="${size}"`)));
  const c = createCanvas(size, size);
  c.getContext("2d").drawImage(img, 0, 0, size, size);
  const buf = c.toBuffer("image/png");
  if (file) writeFileSync(out(file), buf);
  return buf;
}

/** ICO container with embedded PNG images (supported by every modern browser). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const dir = Buffer.alloc(16 * images.length);
  let offset = 6 + dir.length;
  images.forEach(({ size, data }, i) => {
    const e = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, e);
    dir.writeUInt8(size >= 256 ? 0 : size, e + 1);
    dir.writeUInt8(0, e + 2);
    dir.writeUInt8(0, e + 3);
    dir.writeUInt16LE(1, e + 4);
    dir.writeUInt16LE(32, e + 6);
    dir.writeUInt32LE(data.length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, dir, ...images.map((i) => i.data)]);
}

// ---------------------------------------------------------------------------
// Social image (1200×630) with a real, scannable styled QR code.
// ---------------------------------------------------------------------------

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawQr(ctx, data, x, y, size) {
  const qr = qrcode(0, "M");
  qr.addData(data);
  qr.make();
  const n = qr.getModuleCount();
  const pad = 3;
  const m = size / (n + pad * 2);
  roundRect(ctx, x, y, size, size, 28);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  const ox = x + pad * m;
  const oy = y + pad * m;
  const grad = ctx.createLinearGradient(ox, oy, ox + n * m, oy + n * m);
  grad.addColorStop(0, "#6d28d9");
  grad.addColorStop(1, "#db2777");
  ctx.fillStyle = grad;
  const isEye = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  // Alignment pattern (version ≥ 2) drawn solid, like the app does.
  const ap = n > 21 ? n - 7 : -99;
  const isAlign = (r, c) => Math.abs(r - ap) <= 2 && Math.abs(c - ap) <= 2;
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      if (!qr.isDark(r, c) || isEye(r, c) || isAlign(r, c)) continue;
      ctx.beginPath();
      ctx.arc(ox + (c + 0.5) * m, oy + (r + 0.5) * m, m * 0.46, 0, Math.PI * 2);
      ctx.fill();
    }
  const ring = (r0, c0, size7, inner) => {
    ctx.beginPath();
    ctx.roundRect(ox + c0 * m, oy + r0 * m, size7 * m, size7 * m, m * (size7 / 3.2));
    ctx.roundRect(ox + (c0 + 1) * m, oy + (r0 + 1) * m, (size7 - 2) * m, (size7 - 2) * m, m * (size7 / 5.5));
    ctx.fill("evenodd");
    ctx.beginPath();
    ctx.roundRect(ox + (c0 + 2) * m, oy + (r0 + 2) * m, inner * m, inner * m, m * inner * 0.3);
    ctx.fill();
  };
  ring(0, 0, 7, 3);
  ring(0, n - 7, 7, 3);
  ring(n - 7, 0, 7, 3);
  if (ap > 0) ring(ap - 2, ap - 2, 5, 1);
}

async function socialImage(file, siteUrl) {
  const W = 1200;
  const H = 630;
  const c = createCanvas(W, H);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#0b0d14";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(900, 315, 40, 900, 315, 520);
  glow.addColorStop(0, "rgba(124,92,255,0.45)");
  glow.addColorStop(1, "rgba(124,92,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const logo = await loadImage(Buffer.from(logoSvg().replace('width="64" height="64"', 'width="88" height="88"')));
  ctx.drawImage(logo, 72, 72, 88, 88);
  ctx.fillStyle = "#e8eaf2";
  ctx.font = `bold 44px ${FONT}`;
  ctx.textBaseline = "middle";
  ctx.fillText("AnimQR", 180, 118);

  const maxW = 640;
  ctx.font = `bold 56px ${FONT}`;
  ctx.textBaseline = "alphabetic";
  const title = ["Free Animated", "QR Code Generator"];
  title.forEach((line, i) => ctx.fillText(line, 72, 262 + i * 70, maxW));

  ctx.font = `28px ${FONT}`;
  ctx.fillStyle = "#9aa1b8";
  ["Export GIF · MP4 · SVG · PNG", "Logos · gradients · frames", "No sign-up · no watermark · open source"].forEach((line, i) =>
    ctx.fillText(line, 72, 400 + i * 42, maxW),
  );

  ctx.font = `bold 26px ${FONT}`;
  ctx.fillStyle = "#a78bfa";
  ctx.fillText(siteUrl.replace(/^https?:\/\//, ""), 72, 566);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 12;
  roundRect(ctx, 760, 135, 360, 360, 28);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.restore();
  drawQr(ctx, siteUrl, 760, 135, 360);

  writeFileSync(out(file), c.toBuffer("image/png"));
}

// ---------------------------------------------------------------------------

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://animqr.github.io").replace(/\/+$/, "");

writeFileSync(out("app/icon.svg"), logoSvg());
await png(logoSvg(), 180, "app/apple-icon.png");
await png(logoSvg(), 192, "public/icon-192.png");
await png(logoSvg(), 512, "public/icon-512.png");
await png(logoSvg({ padded: true }), 512, "public/maskable-icon-512.png");
const icoImages = [];
for (const size of [16, 32, 48]) icoImages.push({ size, data: await png(logoSvg(), size) });
writeFileSync(out("app/favicon.ico"), ico(icoImages));
await socialImage("app/opengraph-image.png", siteUrl);
await socialImage("app/twitter-image.png", siteUrl);
writeFileSync(out("app/opengraph-image.alt.txt"), "AnimQR — free animated QR code generator. Export GIF, MP4, SVG and PNG.");
writeFileSync(out("app/twitter-image.alt.txt"), "AnimQR — free animated QR code generator. Export GIF, MP4, SVG and PNG.");
console.log("Assets written.");
