import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

export const EC_LEVELS = ["L", "M", "Q", "H"] as const;
export type ECLevel = (typeof EC_LEVELS)[number];

export const MODULE_SHAPES = ["square", "rounded", "dots", "diamond", "star", "vbars", "hbars"] as const;
export type ModuleShape = (typeof MODULE_SHAPES)[number];

export const EYE_SHAPES = ["square", "rounded", "circle", "leaf"] as const;
export type EyeShape = (typeof EYE_SHAPES)[number];

export const FRAMES = ["none", "square", "rounded", "label"] as const;
export type FrameStyle = (typeof FRAMES)[number];

export const ANIMATIONS = [
  "none",
  "pulse",
  "wave",
  "fade",
  "rotate",
  "colorCycle",
  "scan",
  "reveal",
  "particle",
] as const;
export type AnimationPreset = (typeof ANIMATIONS)[number];

export const FORMATS = ["png", "svg", "jpeg", "gif", "webm", "mp4"] as const;
export type ExportFormat = (typeof FORMATS)[number];

export interface Gradient {
  type: "linear" | "radial";
  /** Degrees, only used for linear gradients. */
  angle: number;
  stops: [string, string];
}

export interface QRConfig {
  data: string;
  ec: ECLevel;
  size: number;
  /** Quiet zone in modules. */
  margin: number;
  fg: string;
  /** Hex colour or "transparent". */
  bg: string;
  gradient: Gradient | null;
  module: ModuleShape;
  eye: EyeShape;
  /** Empty string = same as foreground. */
  eyeColor: string;
  logo: string;
  /** Logo width as a fraction of the code width. */
  logoSize: number;
  frame: FrameStyle;
  frameText: string;
  frameColor: string;
  anim: AnimationPreset;
  duration: number;
  fps: number;
  /** GIF loop count, 0 = forever. */
  loop: number;
  format: ExportFormat;
}

export const DEFAULT_CONFIG: QRConfig = {
  data: "",
  ec: "M",
  size: 512,
  margin: 4,
  fg: "#0a1f44",
  bg: "#ffffff",
  gradient: null,
  module: "square",
  eye: "square",
  eyeColor: "",
  logo: "",
  logoSize: 0.22,
  frame: "none",
  frameText: "SCAN ME",
  frameColor: "#800020",
  anim: "none",
  duration: 2000,
  fps: 15,
  loop: 0,
  format: "png",
};

export const LIMITS = {
  dataMaxChars: 2048,
  size: [128, 2048] as const,
  margin: [0, 10] as const,
  duration: [300, 10000] as const,
  fps: [5, 60] as const,
  loop: [0, 100] as const,
  logoSize: [0.08, 0.3] as const,
  frameTextMax: 40,
  logoUrlMax: 2048,
  /** Uploaded logos (data URLs) above this length are not put into share links. */
  logoInLinkMax: 6000,
};

/** Largest logo (fraction of code width) that still leaves enough error-correction headroom. */
export const MAX_LOGO_FOR_EC: Record<ECLevel, number> = { L: 0.12, M: 0.18, Q: 0.24, H: 0.3 };

/** Animations that keep every module visible at all times, so the code stays scannable on every frame. */
export const SAFE_ANIMATIONS: ReadonlySet<AnimationPreset> = new Set([
  "none",
  "pulse",
  "wave",
  "fade",
  "rotate",
  "colorCycle",
  "scan",
]);

// ---------------------------------------------------------------------------
// Sanitizers
// ---------------------------------------------------------------------------

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function sanitizeColor(value: unknown, allowTransparent = false): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim().toLowerCase();
  if (allowTransparent && (v === "transparent" || v === "none")) return "transparent";
  const m = HEX_RE.exec(v);
  if (!m) return undefined;
  let hex = m[1];
  if (hex.length === 3 || hex.length === 4) hex = hex.split("").map((c) => c + c).join("");
  return "#" + hex;
}

function clampNum(value: unknown, [min, max]: readonly [number, number], integer = true): number | undefined {
  const n = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return undefined;
  const c = Math.min(max, Math.max(min, n));
  return integer ? Math.round(c) : c;
}

function oneOf<T extends string>(list: readonly T[], value: unknown): T | undefined {
  if (typeof value !== "string") return undefined;
  const lower = value.trim().toLowerCase();
  return list.find((x) => x.toLowerCase() === lower);
}

const DANGEROUS_SCHEME_RE = /^\s*(javascript|vbscript|data|file):/i;

/** Content coming from a URL must not be a script / data URL that a scanner might execute. */
export function isDangerousData(data: string): boolean {
  return DANGEROUS_SCHEME_RE.test(data);
}

export function sanitizeData(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  // Strip control characters except tab/newline/carriage return.
  // eslint-disable-next-line no-control-regex
  const cleaned = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
  return cleaned.slice(0, LIMITS.dataMaxChars);
}

export function sanitizeLogo(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  if (v === "") return "";
  if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[a-z0-9+/=]+$/i.test(v)) return v;
  if (v.length > LIMITS.logoUrlMax) return undefined;
  try {
    const u = new URL(v);
    if (u.protocol === "https:" || u.protocol === "http:") return u.toString();
  } catch {
    /* invalid URL */
  }
  return undefined;
}

export function sanitizeFrameText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, LIMITS.frameTextMax);
}

/**
 * Gradient notation used in URLs: `linear-45-#ff0-#f0f` or `radial-#ff0-#f0f`.
 * `#` may be omitted or percent-encoded.
 */
export function parseGradient(value: unknown): Gradient | null | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  if (v === "" || v === "none") return null;
  const parts = v.split(/[-_,\s]+/).filter(Boolean);
  const type = oneOf(["linear", "radial"] as const, parts[0]);
  if (!type) return undefined;
  let i = 1;
  let angle = 0;
  if (type === "linear" && parts[i] !== undefined && /^-?\d+(\.\d+)?$/.test(parts[i])) {
    angle = ((Number(parts[i]) % 360) + 360) % 360;
    i++;
  }
  const a = sanitizeColor(parts[i]);
  const b = sanitizeColor(parts[i + 1]);
  if (!a || !b) return undefined;
  return { type, angle, stops: [a, b] };
}

export function formatGradient(g: Gradient | null): string {
  if (!g) return "none";
  const stops = g.stops.map((s) => s.replace("#", "")).join("-");
  return g.type === "linear" ? `linear-${Math.round(g.angle)}-${stops}` : `radial-${stops}`;
}

/** Validate an arbitrary (partial) object into a full config, dropping anything invalid. */
export function sanitizeConfig(input: Record<string, unknown>, base: QRConfig = DEFAULT_CONFIG): QRConfig {
  const out: QRConfig = { ...base };
  const set = <K extends keyof QRConfig>(key: K, v: QRConfig[K] | undefined) => {
    if (v !== undefined) out[key] = v;
  };
  set("data", sanitizeData(input.data ?? input.text));
  set("ec", oneOf(EC_LEVELS, input.ec));
  set("size", clampNum(input.size, LIMITS.size));
  set("margin", clampNum(input.margin, LIMITS.margin));
  set("fg", sanitizeColor(input.fg));
  set("bg", sanitizeColor(input.bg, true));
  if (input.gradient === null) {
    out.gradient = null;
  } else if (typeof input.gradient === "object") {
    const g = input.gradient as Partial<Gradient>;
    const stops = Array.isArray(g.stops) ? g.stops.map((s) => sanitizeColor(s)) : [];
    if (stops[0] && stops[1]) {
      out.gradient = {
        type: g.type === "radial" ? "radial" : "linear",
        angle: clampNum(g.angle, [0, 360], false) ?? 0,
        stops: [stops[0], stops[1]],
      };
    }
  } else {
    set("gradient", parseGradient(input.gradient));
  }
  set("module", oneOf(MODULE_SHAPES, input.module));
  set("eye", oneOf(EYE_SHAPES, input.eye));
  if (input.eyeColor === "" || input.eyeColor === "auto") out.eyeColor = "";
  else set("eyeColor", sanitizeColor(input.eyeColor));
  set("logo", sanitizeLogo(input.logo));
  set("logoSize", clampNum(input.logoSize, LIMITS.logoSize, false));
  set("frame", oneOf(FRAMES, input.frame));
  set("frameText", sanitizeFrameText(input.frameText));
  set("frameColor", sanitizeColor(input.frameColor));
  set("anim", oneOf(ANIMATIONS, input.anim));
  set("duration", clampNum(input.duration, LIMITS.duration));
  set("fps", clampNum(input.fps, LIMITS.fps));
  set("loop", clampNum(input.loop, LIMITS.loop));
  set("format", oneOf(FORMATS, input.format === "jpg" ? "jpeg" : input.format));
  return out;
}

// ---------------------------------------------------------------------------
// URL <-> config
// ---------------------------------------------------------------------------

/** Keys understood as simple query parameters (besides data/text and c/config). */
const SIMPLE_KEYS: (keyof QRConfig)[] = [
  "ec",
  "size",
  "margin",
  "fg",
  "bg",
  "gradient",
  "module",
  "eye",
  "eyeColor",
  "logo",
  "logoSize",
  "frame",
  "frameText",
  "frameColor",
  "anim",
  "duration",
  "fps",
  "loop",
  "format",
];

export interface ParsedUrl {
  config: QRConfig;
  /** True when the URL carried content to encode. */
  hasData: boolean;
  /** True when the URL carried any recognised parameter at all. */
  fromUrl: boolean;
  /** Minimal embed mode: only the code is shown. */
  embed: boolean;
  warnings: string[];
}

export function encodeCompressed(config: Partial<QRConfig>): string {
  return compressToEncodedURIComponent(JSON.stringify(config));
}

export function decodeCompressed(value: string): Record<string, unknown> | null {
  try {
    const json = decompressFromEncodedURIComponent(value);
    if (json) {
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* fall through to base64url */
  }
  // Also accept plain base64url-encoded JSON, as documented.
  try {
    const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  } catch {
    /* invalid */
  }
  return null;
}

export function parseUrlParams(search: string | URLSearchParams): ParsedUrl {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const warnings: string[] = [];
  const raw: Record<string, unknown> = {};

  const compressed = params.get("c") ?? params.get("config");
  if (compressed) {
    const decoded = decodeCompressed(compressed);
    if (decoded) Object.assign(raw, decoded);
    else warnings.push("The configuration in the link could not be read.");
  }

  // Simple params override the compressed config, which makes it easy to tweak shared links.
  for (const [key, value] of params) {
    const match = SIMPLE_KEYS.find((k) => k.toLowerCase() === key.toLowerCase());
    if (match) raw[match] = value;
  }
  const data = params.get("data") ?? params.get("text");
  if (data !== null) raw.data = data;

  const fromUrl = Object.keys(raw).length > 0;
  const config = sanitizeConfig(raw);

  if (typeof raw.data === "string" && raw.data.length > LIMITS.dataMaxChars) {
    warnings.push(`Content was truncated to ${LIMITS.dataMaxChars} characters.`);
  }
  if (config.data && isDangerousData(config.data)) {
    warnings.push("Blocked content with an unsafe scheme (javascript:, data:, …).");
    config.data = "";
  }
  if (typeof raw.logo === "string" && raw.logo !== "" && !config.logo) {
    warnings.push("Ignored logo: only http(s) image URLs are allowed.");
  }

  const embedParam = params.get("embed");
  const embed = embedParam !== null && embedParam !== "0" && embedParam !== "false";

  return { config, hasData: config.data.trim() !== "", fromUrl, embed, warnings };
}

/** Only the values that differ from the defaults. */
export function diffFromDefault(config: QRConfig): Partial<QRConfig> {
  const out: Partial<QRConfig> = {};
  for (const key of Object.keys(DEFAULT_CONFIG) as (keyof QRConfig)[]) {
    const a = config[key];
    const b = DEFAULT_CONFIG[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) (out as Record<string, unknown>)[key] = a;
  }
  return out;
}

export interface ShareOptions {
  /** Force a particular link style. Default: whichever is shorter/readable. */
  mode?: "auto" | "simple" | "compressed";
}

/** Build the query string (without "?") that reproduces the given config. */
export function buildShareQuery(config: QRConfig, { mode = "auto" }: ShareOptions = {}): string {
  const diff = diffFromDefault(config);
  if (diff.logo && diff.logo.startsWith("data:") && diff.logo.length > LIMITS.logoInLinkMax) {
    delete diff.logo; // too big to share in a URL
  }

  const simple = new URLSearchParams();
  if (diff.data !== undefined) simple.set("data", diff.data);
  for (const key of SIMPLE_KEYS) {
    const v = diff[key];
    if (v === undefined) continue;
    simple.set(key, key === "gradient" ? formatGradient(v as Gradient | null) : String(v));
  }
  const simpleStr = simple.toString();
  if (mode === "simple") return simpleStr;

  const compressedStr = Object.keys(diff).length ? "c=" + encodeCompressed(diff) : "";
  if (mode === "compressed") return compressedStr;

  // Prefer human-readable links unless the compressed form is much shorter.
  return compressedStr && compressedStr.length < simpleStr.length * 0.7 ? compressedStr : simpleStr;
}

export function buildShareUrl(config: QRConfig, baseUrl: string, opts?: ShareOptions): string {
  const q = buildShareQuery(config, opts);
  return q ? `${baseUrl}?${q}` : baseUrl;
}
