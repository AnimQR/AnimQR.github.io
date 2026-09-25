/// <reference lib="webworker" />
import jsQR from "jsqr";

export interface ScanRequest {
  id: number;
  expected: string;
  frames: { data: Uint8ClampedArray; width: number; height: number }[];
}

// Decoding is CPU-heavy, so it runs off the main thread.
self.onmessage = (e: MessageEvent<ScanRequest>) => {
  const { id, expected, frames } = e.data;
  let passed = 0;
  for (const f of frames) {
    const res = jsQR(f.data, f.width, f.height, { inversionAttempts: "attemptBoth" });
    if (res && res.data === expected) passed++;
  }
  (self as unknown as Worker).postMessage({ id, passed, total: frames.length });
};
