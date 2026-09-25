import type { QRConfig } from "./config";
import { buildModel, renderFrame, type LogoSource } from "./qr/render";

export interface ScanResult {
  /** Frames tested. */
  total: number;
  /** Frames that decoded to the exact content. */
  passed: number;
}

/**
 * Render a few frames at a phone-camera-like resolution and try to decode them with jsQR.
 * This is a heuristic — real scanners are usually more forgiving than jsQR.
 */
export async function checkScannability(config: QRConfig, logo: LogoSource | null): Promise<ScanResult> {
  const { default: jsQR } = await import("jsqr");
  const model = buildModel({ ...config, size: 480 }, logo);
  const canvas = document.createElement("canvas");
  canvas.width = model.layout.width;
  canvas.height = model.layout.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const times = config.anim === "none" ? [0] : [0, 0.2, 0.4, 0.6, 0.8];
  let passed = 0;
  for (const t of times) {
    renderFrame(ctx, model, t, { matte: "#ffffff" });
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const res = jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
    if (res && res.data === config.data) passed++;
    await new Promise((r) => setTimeout(r, 0));
  }
  return { total: times.length, passed };
}
