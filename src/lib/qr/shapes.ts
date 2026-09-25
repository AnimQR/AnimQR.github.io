import type { EyeShape, ModuleShape } from "../config";

/**
 * Shapes are described once as path commands and emitted either into a canvas Path2D
 * or into an SVG path string, so the preview, raster exports and SVG export are identical.
 */
export type Cmd =
  | ["M", number, number]
  | ["L", number, number]
  | ["C", number, number, number, number, number, number]
  | ["Z"];

export interface PathSink {
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): void;
  closePath(): void;
}

/** Collects commands into an SVG path "d" attribute. */
export class SvgPathSink implements PathSink {
  private parts: string[] = [];
  private f = (n: number) => (Math.round(n * 100) / 100).toString();
  moveTo(x: number, y: number) {
    this.parts.push(`M${this.f(x)} ${this.f(y)}`);
  }
  lineTo(x: number, y: number) {
    this.parts.push(`L${this.f(x)} ${this.f(y)}`);
  }
  bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
    this.parts.push(`C${[x1, y1, x2, y2, x, y].map(this.f).join(" ")}`);
  }
  closePath() {
    this.parts.push("Z");
  }
  toString() {
    return this.parts.join("");
  }
}

export interface Transform {
  /** Centre / origin in output pixels. */
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export function emit(sink: PathSink, cmds: Cmd[], t: Transform) {
  const cos = Math.cos(t.rotation) * t.scale;
  const sin = Math.sin(t.rotation) * t.scale;
  const X = (x: number, y: number) => t.x + x * cos - y * sin;
  const Y = (x: number, y: number) => t.y + x * sin + y * cos;
  for (const c of cmds) {
    switch (c[0]) {
      case "M":
        sink.moveTo(X(c[1], c[2]), Y(c[1], c[2]));
        break;
      case "L":
        sink.lineTo(X(c[1], c[2]), Y(c[1], c[2]));
        break;
      case "C":
        sink.bezierCurveTo(X(c[1], c[2]), Y(c[1], c[2]), X(c[3], c[4]), Y(c[3], c[4]), X(c[5], c[6]), Y(c[5], c[6]));
        break;
      case "Z":
        sink.closePath();
        break;
    }
  }
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

const K = 0.5522847498; // cubic Bézier circle constant

/** Rounded rectangle with individual corner radii, clockwise (or counter-clockwise when reverse). */
export function roundRect(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  [tl, tr, br, bl]: [number, number, number, number],
  reverse = false,
): Cmd[] {
  const cmds: Cmd[] = [];
  if (!reverse) {
    cmds.push(["M", x0 + tl, y0], ["L", x1 - tr, y0]);
    if (tr) cmds.push(["C", x1 - tr + tr * K, y0, x1, y0 + tr - tr * K, x1, y0 + tr]);
    cmds.push(["L", x1, y1 - br]);
    if (br) cmds.push(["C", x1, y1 - br + br * K, x1 - br + br * K, y1, x1 - br, y1]);
    cmds.push(["L", x0 + bl, y1]);
    if (bl) cmds.push(["C", x0 + bl - bl * K, y1, x0, y1 - bl + bl * K, x0, y1 - bl]);
    cmds.push(["L", x0, y0 + tl]);
    if (tl) cmds.push(["C", x0, y0 + tl - tl * K, x0 + tl - tl * K, y0, x0 + tl, y0]);
  } else {
    cmds.push(["M", x0 + tl, y0]);
    if (tl) cmds.push(["C", x0 + tl - tl * K, y0, x0, y0 + tl - tl * K, x0, y0 + tl]);
    cmds.push(["L", x0, y1 - bl]);
    if (bl) cmds.push(["C", x0, y1 - bl + bl * K, x0 + bl - bl * K, y1, x0 + bl, y1]);
    cmds.push(["L", x1 - br, y1]);
    if (br) cmds.push(["C", x1 - br + br * K, y1, x1, y1 - br + br * K, x1, y1 - br]);
    cmds.push(["L", x1, y0 + tr]);
    if (tr) cmds.push(["C", x1, y0 + tr - tr * K, x1 - tr + tr * K, y0, x1 - tr, y0]);
    cmds.push(["L", x0 + tl, y0]);
  }
  cmds.push(["Z"]);
  return cmds;
}

export function circle(cx: number, cy: number, r: number): Cmd[] {
  const k = r * K;
  return [
    ["M", cx, cy - r],
    ["C", cx + k, cy - r, cx + r, cy - k, cx + r, cy],
    ["C", cx + r, cy + k, cx + k, cy + r, cx, cy + r],
    ["C", cx - k, cy + r, cx - r, cy + k, cx - r, cy],
    ["C", cx - r, cy - k, cx - k, cy - r, cx, cy - r],
    ["Z"],
  ];
}

function polygon(points: [number, number][]): Cmd[] {
  const cmds: Cmd[] = points.map(([x, y], i) => [i === 0 ? "M" : "L", x, y] as Cmd);
  cmds.push(["Z"]);
  return cmds;
}

// ---------------------------------------------------------------------------
// Data modules — unit square centred on the origin, spanning [-0.5, 0.5]
// ---------------------------------------------------------------------------

/** Neighbour bitmask: top=1, right=2, bottom=4, left=8. */
export const N_TOP = 1;
export const N_RIGHT = 2;
export const N_BOTTOM = 4;
export const N_LEFT = 8;

const cache = new Map<string, Cmd[]>();

function starPoints(): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.58 : 0.27;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([Math.cos(a) * r, Math.sin(a) * r + 0.04]);
  }
  return pts;
}

/** Whether a shape depends on its neighbours (and therefore must not be rotated by animations). */
export function isConnectedShape(shape: ModuleShape) {
  return shape === "rounded" || shape === "vbars" || shape === "hbars";
}

export function moduleShape(shape: ModuleShape, neighbours: number): Cmd[] {
  const key = isConnectedShape(shape) ? `${shape}:${neighbours}` : shape;
  const hit = cache.get(key);
  if (hit) return hit;
  let cmds: Cmd[];
  const has = (bit: number) => (neighbours & bit) !== 0;
  switch (shape) {
    case "rounded": {
      const r = 0.5;
      cmds = roundRect(-0.5, -0.5, 0.5, 0.5, [
        !has(N_TOP) && !has(N_LEFT) ? r : 0,
        !has(N_TOP) && !has(N_RIGHT) ? r : 0,
        !has(N_BOTTOM) && !has(N_RIGHT) ? r : 0,
        !has(N_BOTTOM) && !has(N_LEFT) ? r : 0,
      ]);
      break;
    }
    case "vbars": {
      const w = 0.4;
      const top = has(N_TOP) ? -0.5 : -0.45;
      const bottom = has(N_BOTTOM) ? 0.5 : 0.45;
      cmds = roundRect(-w, top, w, bottom, [
        has(N_TOP) ? 0 : w,
        has(N_TOP) ? 0 : w,
        has(N_BOTTOM) ? 0 : w,
        has(N_BOTTOM) ? 0 : w,
      ]);
      break;
    }
    case "hbars": {
      const h = 0.4;
      const left = has(N_LEFT) ? -0.5 : -0.45;
      const right = has(N_RIGHT) ? 0.5 : 0.45;
      cmds = roundRect(left, -h, right, h, [
        has(N_LEFT) ? 0 : h,
        has(N_RIGHT) ? 0 : h,
        has(N_RIGHT) ? 0 : h,
        has(N_LEFT) ? 0 : h,
      ]);
      break;
    }
    case "dots":
      cmds = circle(0, 0, 0.46);
      break;
    case "diamond":
      cmds = polygon([
        [0, -0.62],
        [0.62, 0],
        [0, 0.62],
        [-0.62, 0],
      ]);
      break;
    case "star":
      cmds = polygon(starPoints());
      break;
    case "square":
    default:
      cmds = roundRect(-0.5, -0.5, 0.5, 0.5, [0, 0, 0, 0]);
  }
  cache.set(key, cmds);
  return cmds;
}

// ---------------------------------------------------------------------------
// Eyes (finder patterns) — coordinates in modules, 0..7, relative to the eye's top-left.
// Rendered with the even-odd fill rule so the ring has a hole.
// ---------------------------------------------------------------------------

export type EyeCorner = "tl" | "tr" | "bl";

export function eyeShape(shape: EyeShape, corner: EyeCorner): { outer: Cmd[]; inner: Cmd[] } {
  switch (shape) {
    case "circle":
      return {
        outer: [...circle(3.5, 3.5, 3.5), ...circle(3.5, 3.5, 2.5)],
        inner: circle(3.5, 3.5, 1.5),
      };
    case "rounded":
      return {
        outer: [...roundRect(0, 0, 7, 7, [2.2, 2.2, 2.2, 2.2]), ...roundRect(1, 1, 6, 6, [1.3, 1.3, 1.3, 1.3], true)],
        inner: roundRect(2, 2, 5, 5, [0.9, 0.9, 0.9, 0.9]),
      };
    case "leaf": {
      // Two opposite corners rounded; the corner pointing into the code stays square.
      const R = 3.2;
      const r = 2.2;
      const ri = 1.3;
      const radii = (v: number): [number, number, number, number] =>
        corner === "tl" ? [v, 0, v, 0] : corner === "tr" ? [0, v, 0, v] : [0, v, 0, v];
      return {
        outer: [...roundRect(0, 0, 7, 7, radii(R)), ...roundRect(1, 1, 6, 6, radii(r), true)],
        inner: roundRect(2, 2, 5, 5, radii(ri)),
      };
    }
    case "square":
    default:
      return {
        outer: [...roundRect(0, 0, 7, 7, [0, 0, 0, 0]), ...roundRect(1, 1, 6, 6, [0, 0, 0, 0], true)],
        inner: roundRect(2, 2, 5, 5, [0, 0, 0, 0]),
      };
  }
}

/** Alignment pattern (5×5), coordinates 0..5 relative to its top-left. Even-odd fill. */
export function alignmentShape(shape: EyeShape): Cmd[] {
  if (shape === "circle") return [...circle(2.5, 2.5, 2.5), ...circle(2.5, 2.5, 1.5), ...circle(2.5, 2.5, 0.55)];
  const rounded = shape !== "square";
  const R = rounded ? 1.4 : 0;
  const r = rounded ? 0.6 : 0;
  return [
    ...roundRect(0, 0, 5, 5, [R, R, R, R]),
    ...roundRect(1, 1, 4, 4, [r, r, r, r], true),
    ...(rounded ? circle(2.5, 2.5, 0.55) : roundRect(2, 2, 3, 3, [0, 0, 0, 0])),
  ];
}
