import type { AnimationPreset, ModuleShape } from "../config";
import { isConnectedShape } from "./shapes";

/** Per-module state for one frame. Offsets are in modules. */
export interface ModuleState {
  dx: number;
  dy: number;
  scale: number;
  rotation: number;
  alpha: number;
}

export interface FrameGlobals {
  /** Hue rotation applied to all colours, in degrees. */
  hueShift: number;
  /** Scan-line position as a fraction of the code height, or null. */
  scanLine: number | null;
  /** Opacity of the finder patterns. */
  eyeAlpha: number;
}

const TAU = Math.PI * 2;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInCubic = (x: number) => x * x * x;
const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

/** Deterministic pseudo-random in [0, 1) so every frame (and every export) is identical. */
export function hash01(n: number): number {
  let x = (n | 0) + 0x6d2b79f5;
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
}

export function frameGlobals(anim: AnimationPreset, t: number): FrameGlobals {
  return {
    hueShift: anim === "colorCycle" ? t * 360 : 0,
    scanLine: anim === "scan" ? 0.5 - 0.5 * Math.cos(t * TAU) : null,
    eyeAlpha: 1,
  };
}

const IDENTITY: ModuleState = { dx: 0, dy: 0, scale: 1, rotation: 0, alpha: 1 };

/** Rotational symmetry of each shape, so the rotation loop is seamless. */
function symmetryAngle(shape: ModuleShape): number {
  if (shape === "star") return TAU / 5;
  return Math.PI / 2;
}

/**
 * Compute the state of the module at (row, col) at normalized time t ∈ [0, 1).
 * Presets flagged as "safe" keep every module visible at all times (min scale ≈ 0.75).
 */
export function moduleState(
  anim: AnimationPreset,
  shape: ModuleShape,
  row: number,
  col: number,
  count: number,
  t: number,
): ModuleState {
  if (anim === "none" || anim === "colorCycle") return IDENTITY;
  const half = (count - 1) / 2;
  const dist = Math.hypot(row - half, col - half) / (half * Math.SQRT2); // 0 centre … 1 corner

  switch (anim) {
    case "pulse": {
      const w = 0.5 + 0.5 * Math.cos(TAU * (t - dist * 0.8));
      return { ...IDENTITY, scale: 0.78 + 0.22 * w };
    }
    case "wave": {
      const phase = TAU * (t - col / count);
      return { ...IDENTITY, dy: 0.16 * Math.sin(phase), scale: 0.88 + 0.12 * (0.5 + 0.5 * Math.cos(phase)) };
    }
    case "fade": {
      const phase = TAU * (t - (row + col) / (2 * count));
      return { ...IDENTITY, alpha: 0.6 + 0.4 * (0.5 + 0.5 * Math.cos(phase)) };
    }
    case "rotate": {
      if (isConnectedShape(shape)) {
        const w = 0.5 + 0.5 * Math.cos(TAU * (t - dist));
        return { ...IDENTITY, scale: 0.8 + 0.2 * w };
      }
      const local = (((t + dist * 0.5) % 1) + 1) % 1;
      return { ...IDENTITY, scale: 0.82, rotation: local * symmetryAngle(shape) };
    }
    case "scan": {
      const pos = 0.5 - 0.5 * Math.cos(t * TAU);
      const d = (row + 0.5) / count - pos;
      const g = Math.exp(-(d * d) / 0.004);
      return { ...IDENTITY, scale: 0.9 + 0.2 * g };
    }
    case "reveal": {
      // Modules pop in along a diagonal sweep, hold, then fade out to loop.
      const order = (row + col) / (2 * (count - 1)) * 0.8 + hash01(row * count + col) * 0.2;
      const start = order * 0.45;
      const p = clamp01((t - start) / 0.12);
      const out = t > 0.88 ? 1 - clamp01((t - 0.88) / 0.12) : 1;
      return { ...IDENTITY, scale: easeOutBack(p) * (0.6 + 0.4 * out), alpha: clamp01(p) * out };
    }
    case "particle": {
      const i = row * count + col;
      const angle = hash01(i) * TAU;
      const radius = count * (0.5 + hash01(i + 7919) * 0.7);
      const delay = hash01(i + 104729) * 0.25;
      let k: number; // 0 = scattered, 1 = in place
      if (t < 0.55) k = easeOutCubic(clamp01((t - delay) / 0.3));
      else if (t < 0.85) k = 1;
      else k = 1 - easeInCubic(clamp01((t - 0.85 - delay * 0.3) / 0.12));
      const off = 1 - k;
      return {
        dx: Math.cos(angle) * radius * off,
        dy: Math.sin(angle) * radius * off,
        scale: 0.4 + 0.6 * k,
        rotation: off * Math.PI,
        alpha: 0.2 + 0.8 * k,
      };
    }
    default:
      return IDENTITY;
  }
}
