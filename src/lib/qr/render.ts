import { MAX_LOGO_FOR_EC, type QRConfig } from "../config";
import { frameGlobals, moduleState } from "./animations";
import { shiftHue } from "./color";
import { createMatrix, type QRMatrix } from "./matrix";
import {
  emit,
  eyeShape,
  moduleShape,
  N_BOTTOM,
  N_LEFT,
  N_RIGHT,
  N_TOP,
  alignmentShape,
  roundRect,
  SvgPathSink,
  type Cmd,
  type EyeCorner,
  type PathSink,
} from "./shapes";

export type LogoSource = CanvasImageSource & { width: number; height: number };

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Layout {
  width: number;
  height: number;
  /** The QR area including quiet zone (drawn with the background colour). */
  qrBox: Box;
  /** Top-left of module (0,0) and module size in px. */
  ox: number;
  oy: number;
  m: number;
  border: number;
  labelBox: Box | null;
  logoBox: Box | null;
}

export interface RenderModel {
  config: QRConfig;
  matrix: QRMatrix;
  layout: Layout;
  neighbours: Uint8Array;
  /** Modules hidden behind the logo. */
  hidden: Uint8Array;
  logo: LogoSource | null;
  /** Effective logo size after clamping to what the error-correction level can absorb. */
  logoSize: number;
}

export function computeLayout(config: QRConfig, count: number, logoSize: number, hasLogo: boolean): Layout {
  const size = config.size;
  const framed = config.frame !== "none";
  const border = framed ? Math.round(size * 0.035) : 0;
  const labelH = config.frame === "label" ? Math.round(size * 0.16) : 0;
  const width = size;
  const height = size + labelH;
  const qrW = size - 2 * border;
  const qrBox = { x: border, y: border, w: qrW, h: qrW };
  const m = qrW / (count + 2 * config.margin);
  const ox = qrBox.x + config.margin * m;
  const oy = qrBox.y + config.margin * m;
  const labelBox = labelH ? { x: border, y: border + qrW, w: qrW, h: labelH + border } : null;

  let logoBox: Box | null = null;
  if (hasLogo) {
    // Snap to whole modules so the cleared area is tidy.
    let n = Math.round(count * logoSize);
    if ((count - n) % 2 !== 0) n += 1;
    const px = n * m;
    logoBox = { x: ox + ((count - n) / 2) * m, y: oy + ((count - n) / 2) * m, w: px, h: px };
  }
  return { width, height, qrBox, ox, oy, m, border, labelBox, logoBox };
}

export function buildModel(config: QRConfig, logo: LogoSource | null = null): RenderModel {
  const matrix = createMatrix(config.data, config.ec);
  const { count } = matrix;
  const logoSize = Math.min(config.logoSize, MAX_LOGO_FOR_EC[config.ec]);
  const layout = computeLayout(config, count, logoSize, !!logo);

  const neighbours = new Uint8Array(count * count);
  const hidden = new Uint8Array(count * count);
  const lb = layout.logoBox;
  // Logo box in module coordinates, with a small padding.
  const pad = 0.5;
  const lx0 = lb ? (lb.x - layout.ox) / layout.m - pad : 0;
  const lx1 = lb ? (lb.x + lb.w - layout.ox) / layout.m + pad : 0;
  const ly0 = lb ? (lb.y - layout.oy) / layout.m - pad : 0;
  const ly1 = lb ? (lb.y + lb.h - layout.oy) / layout.m + pad : 0;

  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      const i = r * count + c;
      if (lb && c + 1 > lx0 && c < lx1 && r + 1 > ly0 && r < ly1) hidden[i] = 1;
    }
  }
  const on = (r: number, c: number) =>
    matrix.isDark(r, c) && !matrix.isEye(r, c) && !matrix.isAlignment(r, c) && !hidden[r * count + c];
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      let n = 0;
      if (on(r - 1, c)) n |= N_TOP;
      if (on(r, c + 1)) n |= N_RIGHT;
      if (on(r + 1, c)) n |= N_BOTTOM;
      if (on(r, c - 1)) n |= N_LEFT;
      neighbours[r * count + c] = n;
    }
  }
  return { config, matrix, layout, neighbours, hidden, logo, logoSize };
}

// ---------------------------------------------------------------------------
// Geometry shared by canvas and SVG back-ends
// ---------------------------------------------------------------------------

/**
 * Emit all data modules at time t. Modules are grouped by (quantised) opacity so the canvas
 * back-end can fill each group with a single call.
 */
function emitModules(model: RenderModel, t: number, sinkFor: (alpha: number) => PathSink) {
  const { matrix, layout, config, neighbours, hidden } = model;
  const { count } = matrix;
  const { ox, oy, m } = layout;
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      const i = r * count + c;
      if (!matrix.modules[i] || matrix.isEye(r, c) || matrix.isAlignment(r, c) || hidden[i]) continue;
      const st = moduleState(config.anim, config.module, r, c, count, t);
      if (st.alpha <= 0.01 || st.scale <= 0.01) continue;
      const alpha = Math.round(st.alpha * 20) / 20;
      emit(sinkFor(alpha), moduleShape(config.module, neighbours[i]), {
        x: ox + (c + 0.5 + st.dx) * m,
        y: oy + (r + 0.5 + st.dy) * m,
        scale: m * st.scale,
        rotation: st.rotation,
      });
    }
  }
}

const EYES: { corner: EyeCorner; row: (n: number) => number; col: (n: number) => number }[] = [
  { corner: "tl", row: () => 0, col: () => 0 },
  { corner: "tr", row: () => 0, col: (n) => n - 7 },
  { corner: "bl", row: (n) => n - 7, col: () => 0 },
];

function emitEyes(model: RenderModel, sink: PathSink) {
  const { layout, config, matrix } = model;
  for (const eye of EYES) {
    const { outer, inner } = eyeShape(config.eye, eye.corner);
    const t = {
      x: layout.ox + eye.col(matrix.count) * layout.m,
      y: layout.oy + eye.row(matrix.count) * layout.m,
      scale: layout.m,
      rotation: 0,
    };
    emit(sink, outer, t);
    emit(sink, inner, t);
  }
}

/**
 * Alignment patterns are drawn as solid shapes (never animated or stylised into dots) —
 * decoders rely on them to correct perspective. Ones covered by the logo are skipped.
 */
function emitAlignments(model: RenderModel, sink: PathSink) {
  const { layout, config, matrix, hidden } = model;
  const cmds = alignmentShape(config.eye);
  for (const [r, c] of matrix.alignments) {
    if (hidden[r * matrix.count + c]) continue;
    emit(sink, cmds, { x: layout.ox + (c - 2) * layout.m, y: layout.oy + (r - 2) * layout.m, scale: layout.m, rotation: 0 });
  }
}

function frameCmds(model: RenderModel): Cmd[] | null {
  const { config, layout } = model;
  if (config.frame === "none") return null;
  const r = config.frame === "square" ? 0 : Math.round(layout.width * 0.06);
  return roundRect(0, 0, layout.width, layout.height, [r, r, r, r]);
}

function qrBgCmds(model: RenderModel): Cmd[] {
  const { config, layout } = model;
  const { x, y, w, h } = layout.qrBox;
  const r = config.frame === "rounded" || config.frame === "label" ? Math.round(layout.width * 0.035) : 0;
  const bottom = config.frame === "label" ? 0 : r;
  return roundRect(x, y, x + w, y + h, [r, r, bottom, bottom]);
}

function labelFontSize(layout: Layout) {
  return Math.round((layout.labelBox?.h ?? 0) * 0.46);
}

export interface Palette {
  fg: string;
  eye: string;
  stops: [string, string] | null;
}

export function framePalette(config: QRConfig, t: number): Palette {
  const { hueShift } = frameGlobals(config.anim, t);
  const shift = (c: string) => (hueShift ? shiftHue(c, hueShift) : c);
  return {
    fg: shift(config.fg),
    eye: config.eyeColor ? shift(config.eyeColor) : "",
    stops: config.gradient ? [shift(config.gradient.stops[0]), shift(config.gradient.stops[1])] : null,
  };
}

/** Gradient end-points in pixels for the code area. */
function gradientGeometry(model: RenderModel) {
  const { layout, matrix, config } = model;
  const size = matrix.count * layout.m;
  const cx = layout.ox + size / 2;
  const cy = layout.oy + size / 2;
  const g = config.gradient!;
  if (g.type === "radial") return { type: "radial" as const, cx, cy, r: size * 0.72 };
  const a = (g.angle * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const half = (size / 2) * (Math.abs(dx) + Math.abs(dy));
  return { type: "linear" as const, x0: cx - dx * half, y0: cy - dy * half, x1: cx + dx * half, y1: cy + dy * half };
}

// ---------------------------------------------------------------------------
// Canvas back-end
// ---------------------------------------------------------------------------

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function toPath2D(cmds: Cmd[]): Path2D {
  const p = new Path2D();
  emit(p, cmds, { x: 0, y: 0, scale: 1, rotation: 0 });
  return p;
}

export interface RenderOptions {
  /** Paint this colour under everything (used for GIF/JPEG which lack alpha). */
  matte?: string;
}

export function renderFrame(ctx: Ctx, model: RenderModel, t: number, opts: RenderOptions = {}) {
  const { config, layout } = model;
  const palette = framePalette(config, t);
  const globals = frameGlobals(config.anim, t);

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, layout.width, layout.height);
  if (opts.matte) {
    ctx.fillStyle = opts.matte;
    ctx.fillRect(0, 0, layout.width, layout.height);
  }

  // Frame + label
  const frame = frameCmds(model);
  if (frame) {
    ctx.fillStyle = config.frameColor;
    ctx.fill(toPath2D(frame));
  }
  if (config.bg !== "transparent") {
    ctx.fillStyle = config.bg;
    ctx.fill(toPath2D(qrBgCmds(model)));
  } else if (frame) {
    // Punch the code area out of the frame so the code sits on transparency.
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fill(toPath2D(qrBgCmds(model)));
    ctx.restore();
    if (opts.matte) {
      ctx.fillStyle = opts.matte;
      ctx.fill(toPath2D(qrBgCmds(model)));
    }
  }
  if (layout.labelBox && config.frameText) {
    const lb = layout.labelBox;
    ctx.fillStyle = config.bg === "transparent" ? "#ffffff" : config.bg;
    ctx.font = `700 ${labelFontSize(layout)}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(config.frameText, lb.x + lb.w / 2, lb.y + lb.h / 2, lb.w * 0.92);
  }

  // Foreground paint
  let fgStyle: string | CanvasGradient = palette.fg;
  if (config.gradient && palette.stops) {
    const g = gradientGeometry(model);
    const grad =
      g.type === "radial"
        ? ctx.createRadialGradient(g.cx, g.cy, 0, g.cx, g.cy, g.r)
        : ctx.createLinearGradient(g.x0, g.y0, g.x1, g.y1);
    grad.addColorStop(0, palette.stops[0]);
    grad.addColorStop(1, palette.stops[1]);
    fgStyle = grad;
  }

  // Modules, grouped by opacity
  const groups = new Map<number, Path2D>();
  emitModules(model, t, (alpha) => {
    let p = groups.get(alpha);
    if (!p) groups.set(alpha, (p = new Path2D()));
    return p;
  });
  ctx.fillStyle = fgStyle;
  for (const [alpha, path] of groups) {
    ctx.globalAlpha = alpha;
    ctx.fill(path);
  }
  ctx.globalAlpha = 1;
  const align = new Path2D();
  emitAlignments(model, align);
  ctx.fill(align, "evenodd");
  ctx.globalAlpha = globals.eyeAlpha;

  // Eyes
  const eyes = new Path2D();
  emitEyes(model, eyes);
  ctx.fillStyle = palette.eye || fgStyle;
  ctx.fill(eyes, "evenodd");
  ctx.globalAlpha = 1;

  // Scan line overlay
  if (globals.scanLine !== null) {
    const size = model.matrix.count * layout.m;
    const y = layout.oy + globals.scanLine * size;
    const grad = ctx.createLinearGradient(0, y - layout.m * 1.5, 0, y + layout.m * 1.5);
    const c = (palette.stops ? palette.stops[1] : palette.eye || palette.fg).slice(0, 7);
    grad.addColorStop(0, c + "00");
    grad.addColorStop(0.5, c + "40");
    grad.addColorStop(1, c + "00");
    ctx.fillStyle = grad;
    ctx.fillRect(layout.ox - layout.m, y - layout.m * 1.5, size + 2 * layout.m, layout.m * 3);
  }

  // Logo
  if (model.logo && layout.logoBox) {
    const b = layout.logoBox;
    const pad = layout.m * 0.3;
    const iw = model.logo.width || 1;
    const ih = model.logo.height || 1;
    const s = Math.min((b.w - 2 * pad) / iw, (b.h - 2 * pad) / ih);
    const w = iw * s;
    const h = ih * s;
    ctx.drawImage(model.logo, b.x + (b.w - w) / 2, b.y + (b.h - h) / 2, w, h);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// SVG back-end (static, t = 0 unless an explicit time is given)
// ---------------------------------------------------------------------------

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);
}

function cmdsToD(cmds: Cmd[]) {
  const s = new SvgPathSink();
  emit(s, cmds, { x: 0, y: 0, scale: 1, rotation: 0 });
  return s.toString();
}

export function renderSvg(model: RenderModel, t = 0, logoHref?: string): string {
  const { config, layout } = model;
  const palette = framePalette(config, t);
  const parts: string[] = [];
  const defs: string[] = [];

  let fill = palette.fg;
  if (config.gradient && palette.stops) {
    const g = gradientGeometry(model);
    const stops = `<stop offset="0" stop-color="${palette.stops[0]}"/><stop offset="1" stop-color="${palette.stops[1]}"/>`;
    defs.push(
      g.type === "radial"
        ? `<radialGradient id="fg" gradientUnits="userSpaceOnUse" cx="${g.cx}" cy="${g.cy}" r="${g.r}">${stops}</radialGradient>`
        : `<linearGradient id="fg" gradientUnits="userSpaceOnUse" x1="${g.x0}" y1="${g.y0}" x2="${g.x1}" y2="${g.y1}">${stops}</linearGradient>`,
    );
    fill = "url(#fg)";
  }

  const frame = frameCmds(model);
  if (frame) {
    if (config.bg === "transparent") {
      defs.push(
        `<mask id="hole"><rect width="${layout.width}" height="${layout.height}" fill="#fff"/><path d="${cmdsToD(qrBgCmds(model))}" fill="#000"/></mask>`,
      );
      parts.push(`<path d="${cmdsToD(frame)}" fill="${config.frameColor}" mask="url(#hole)"/>`);
    } else {
      parts.push(`<path d="${cmdsToD(frame)}" fill="${config.frameColor}"/>`);
    }
  }
  if (config.bg !== "transparent") parts.push(`<path d="${cmdsToD(qrBgCmds(model))}" fill="${config.bg}"/>`);
  if (layout.labelBox && config.frameText) {
    const lb = layout.labelBox;
    parts.push(
      `<text x="${lb.x + lb.w / 2}" y="${lb.y + lb.h / 2}" fill="${config.bg === "transparent" ? "#ffffff" : config.bg}" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-weight="700" font-size="${labelFontSize(layout)}" text-anchor="middle" dominant-baseline="central">${escapeXml(config.frameText)}</text>`,
    );
  }

  const groups = new Map<number, SvgPathSink>();
  emitModules(model, t, (alpha) => {
    let s = groups.get(alpha);
    if (!s) groups.set(alpha, (s = new SvgPathSink()));
    return s;
  });
  for (const [alpha, sink] of groups) {
    parts.push(`<path d="${sink.toString()}" fill="${fill}"${alpha < 1 ? ` fill-opacity="${alpha}"` : ""}/>`);
  }
  const align = new SvgPathSink();
  emitAlignments(model, align);
  if (model.matrix.alignments.length) parts.push(`<path d="${align.toString()}" fill="${fill}" fill-rule="evenodd"/>`);
  const eyes = new SvgPathSink();
  emitEyes(model, eyes);
  parts.push(`<path d="${eyes.toString()}" fill="${palette.eye || fill}" fill-rule="evenodd"/>`);

  if (layout.logoBox && (logoHref ?? config.logo)) {
    const b = layout.logoBox;
    const pad = layout.m * 0.3;
    parts.push(
      `<image href="${escapeXml(logoHref ?? config.logo)}" x="${b.x + pad}" y="${b.y + pad}" width="${b.w - 2 * pad}" height="${b.h - 2 * pad}" preserveAspectRatio="xMidYMid meet"/>`,
    );
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" shape-rendering="geometricPrecision">` +
    (defs.length ? `<defs>${defs.join("")}</defs>` : "") +
    parts.join("") +
    `</svg>`
  );
}
