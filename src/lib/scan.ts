import type { QRConfig } from "./config";
import { buildModel, renderFrame, type LogoSource } from "./qr/render";

export interface ScanResult {
  /** Frames tested. */
  total: number;
  /** Frames that decoded to the exact content. */
  passed: number;
}

type Frame = { data: Uint8ClampedArray; width: number; height: number };

let worker: Worker | null = null;
let workerBroken = false;
let nextId = 0;
const pending = new Map<number, { frames: Frame[]; expected: string; resolve: (r: ScanResult) => void }>();

async function decodeOnMainThread(frames: Frame[], expected: string): Promise<ScanResult> {
  const { default: jsQR } = await import("jsqr");
  let passed = 0;
  for (const f of frames) {
    const res = jsQR(f.data, f.width, f.height, { inversionAttempts: "attemptBoth" });
    if (res && res.data === expected) passed++;
  }
  return { total: frames.length, passed };
}

function getWorker(): Worker | null {
  if (worker) return worker;
  if (workerBroken || typeof Worker === "undefined") return null;
  try {
    worker = new Worker(new URL("./scan.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<{ id: number } & ScanResult>) => {
      pending.get(e.data.id)?.resolve({ passed: e.data.passed, total: e.data.total });
      pending.delete(e.data.id);
    };
    // If the worker can't start, finish outstanding checks on the main thread.
    worker.onerror = () => {
      workerBroken = true;
      worker = null;
      for (const p of pending.values()) decodeOnMainThread(p.frames, p.expected).then(p.resolve);
      pending.clear();
    };
    return worker;
  } catch {
    return null;
  }
}

/**
 * Render a few frames at a phone-camera-like resolution and try to decode them with jsQR
 * (in a Web Worker when available). A heuristic — real scanners are usually more forgiving.
 */
export async function checkScannability(config: QRConfig, logo: LogoSource | null): Promise<ScanResult> {
  const model = buildModel({ ...config, size: 480 }, logo);
  const canvas = document.createElement("canvas");
  canvas.width = model.layout.width;
  canvas.height = model.layout.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const times = config.anim === "none" ? [0] : [0, 0.2, 0.4, 0.6, 0.8];
  const frames: Frame[] = times.map((t) => {
    renderFrame(ctx, model, t, { matte: "#ffffff" });
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return { data: img.data, width: img.width, height: img.height };
  });
  canvas.width = canvas.height = 0; // free canvas memory now (iOS has a hard cap)

  const w = getWorker();
  if (w) {
    const id = nextId++;
    return new Promise((resolve) => {
      pending.set(id, { frames, expected: config.data, resolve });
      // Frames are copied (not transferred) so they remain available for the fallback.
      w.postMessage({ id, expected: config.data, frames });
    });
  }
  return decodeOnMainThread(frames, config.data);
}
