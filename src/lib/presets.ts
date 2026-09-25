import type { QRConfig } from "./config";

export type StylePreset = { name: string; style: Partial<QRConfig> };

/** Style-only presets: applying one never changes the encoded content. */
export const BUILTIN_PRESETS: StylePreset[] = [
  { name: "Classic", style: { fg: "#111827", bg: "#ffffff", gradient: null, module: "square", eye: "square", eyeColor: "", frame: "none", anim: "none" } },
  {
    name: "Sunset",
    style: {
      bg: "#fff7ed",
      gradient: { type: "linear", angle: 45, stops: ["#ea580c", "#be185d"] },
      module: "dots",
      eye: "rounded",
      eyeColor: "#9a3412",
      frame: "none",
      anim: "pulse",
    },
  },
  {
    name: "Ocean wave",
    style: {
      bg: "#f0f9ff",
      gradient: { type: "linear", angle: 90, stops: ["#0369a1", "#0e7490"] },
      module: "rounded",
      eye: "circle",
      eyeColor: "",
      frame: "rounded",
      frameColor: "#0c4a6e",
      anim: "wave",
    },
  },
  {
    name: "Neon scan",
    style: {
      fg: "#22d3ee",
      bg: "#0b1020",
      gradient: { type: "linear", angle: 135, stops: ["#22d3ee", "#a78bfa"] },
      module: "square",
      eye: "leaf",
      eyeColor: "#f0abfc",
      frame: "none",
      anim: "scan",
    },
  },
  {
    name: "Rainbow",
    style: { fg: "#7c2d12", bg: "#ffffff", gradient: null, module: "rounded", eye: "rounded", eyeColor: "", frame: "none", anim: "colorCycle" },
  },
  {
    name: "Scan me",
    style: {
      fg: "#1e1b4b",
      bg: "#ffffff",
      gradient: null,
      module: "vbars",
      eye: "rounded",
      eyeColor: "#4f46e5",
      frame: "label",
      frameColor: "#4f46e5",
      frameText: "SCAN ME",
      anim: "none",
    },
  },
  {
    name: "Starfield",
    style: {
      fg: "#fbbf24",
      bg: "#111827",
      gradient: { type: "radial", angle: 0, stops: ["#fde68a", "#f59e0b"] },
      module: "star",
      eye: "circle",
      eyeColor: "#fde68a",
      frame: "none",
      anim: "rotate",
    },
  },
  {
    name: "Particles",
    style: {
      fg: "#065f46",
      bg: "#ecfdf5",
      gradient: { type: "linear", angle: 0, stops: ["#047857", "#0f766e"] },
      module: "dots",
      eye: "rounded",
      eyeColor: "",
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
