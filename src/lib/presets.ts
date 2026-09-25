import type { QRConfig } from "./config";

export type StylePreset = { name: string; style: Partial<QRConfig> };

/** Style-only presets: applying one never changes the encoded content. */
export const BUILTIN_PRESETS: StylePreset[] = [
  {
    name: "Maroon & Navy",
    style: {
      fg: "#0a1f44",
      bg: "#ffffff",
      gradient: { type: "linear", angle: 45, stops: ["#800020", "#0a1f44"] },
      module: "dots",
      eye: "rounded",
      eyeColor: "#800020",
      frame: "none",
      anim: "pulse",
    },
  },
  { name: "Classic navy", style: { fg: "#0a1f44", bg: "#ffffff", gradient: null, module: "square", eye: "square", eyeColor: "", frame: "none", anim: "none" } },
  {
    name: "Maroon wave",
    style: {
      fg: "#800020",
      bg: "#fdf6f7",
      gradient: null,
      module: "rounded",
      eye: "circle",
      eyeColor: "#0a1f44",
      frame: "rounded",
      frameColor: "#0a1f44",
      anim: "wave",
    },
  },
  {
    name: "Midnight scan",
    style: {
      fg: "#f8c9d4",
      bg: "#0a1f44",
      gradient: { type: "linear", angle: 135, stops: ["#ffe1e8", "#f28ba3"] },
      module: "square",
      eye: "leaf",
      eyeColor: "#ffffff",
      frame: "none",
      anim: "scan",
    },
  },
  {
    name: "Colour cycle",
    style: { fg: "#800020", bg: "#ffffff", gradient: null, module: "rounded", eye: "rounded", eyeColor: "", frame: "none", anim: "colorCycle" },
  },
  {
    name: "Scan me",
    style: {
      fg: "#0a1f44",
      bg: "#ffffff",
      gradient: null,
      module: "vbars",
      eye: "rounded",
      eyeColor: "#800020",
      frame: "label",
      frameColor: "#800020",
      frameText: "SCAN ME",
      anim: "none",
    },
  },
  {
    name: "Royal stars",
    style: {
      fg: "#0a1f44",
      bg: "#ffffff",
      gradient: { type: "radial", angle: 0, stops: ["#800020", "#0a1f44"] },
      module: "star",
      eye: "circle",
      eyeColor: "#0a1f44",
      frame: "square",
      frameColor: "#0a1f44",
      anim: "rotate",
    },
  },
  {
    name: "Particles",
    style: {
      fg: "#0a1f44",
      bg: "#f5f7fc",
      gradient: { type: "linear", angle: 0, stops: ["#0a1f44", "#5c0017"] },
      module: "dots",
      eye: "rounded",
      eyeColor: "#800020",
      frame: "none",
      anim: "particle",
    },
  },
];

const STYLE_KEYS: (keyof QRConfig)[] = [
  "fg", "bg", "gradient", "module", "eye", "eyeColor", "frame", "frameText", "frameColor",
  "anim", "duration", "fps", "margin", "ec", "logoSize",
];

export function extractStyle(config: QRConfig): Partial<QRConfig> {
  const out: Partial<QRConfig> = {};
  for (const k of STYLE_KEYS) (out as Record<string, unknown>)[k] = config[k];
  return out;
}

const STORAGE_KEY = "animqr:presets";

export function loadUserPresets(): StylePreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((p) => p && typeof p.name === "string" && p.style) : [];
  } catch {
    return [];
  }
}

export function saveUserPresets(presets: StylePreset[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    /* storage unavailable */
  }
}
