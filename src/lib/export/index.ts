import type { QRConfig } from "../config";
import { buildModel, renderFrame, renderSvg, type LogoSource, type RenderModel } from "../qr/render";

export interface ExportProgress {
  (fraction: number, label?: string): void;
}

export function frameCount(config: QRConfig) {
  return Math.max(2, Math.round((config.duration / 1000) * config.fps));
}

export function fileBaseName(config: QRConfig) {
  const slug = config.data
    .replace(/^[a-z]+:\/\//i, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
    .toLowerCase();
  return `animqr-${slug || "code"}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function makeCanvas(model: RenderModel) {
  const canvas = document.createElement("canvas");
  canvas.width = model.layout.width;
  canvas.height = model.layout.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  return { canvas, ctx };
}

const nextTick = () => new Promise<void>((r) => setTimeout(r, 0));

export async function exportRaster(
  config: QRConfig,
  logo: LogoSource | null,
  type: "png" | "jpeg",
  t = 0,
): Promise<Blob> {
  const model = buildModel(config, logo);
  const { canvas, ctx } = makeCanvas(model);
  renderFrame(ctx, model, t, type === "jpeg" ? { matte: "#ffffff" } : {});
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => {
        canvas.width = canvas.height = 0; // free canvas memory (iOS has a hard cap)
        if (b) resolve(b);
        else reject(new Error("Could not encode image (is the logo CORS-enabled?)"));
      },
      type === "jpeg" ? "image/jpeg" : "image/png",
      0.92,
    ),
  );
}

export async function exportSvg(config: QRConfig, logo: LogoSource | null, t = 0): Promise<Blob> {
  const model = buildModel(config, logo);
  return new Blob([renderSvg(model, t)], { type: "image/svg+xml" });
}

/** Map our loop semantics (0 = forever, n = play n times) onto the GIF NETSCAPE extension. */
export function gifRepeat(loop: number) {
  if (loop <= 0) return 0;
  if (loop === 1) return -1;
  return loop - 1;
}

export async function exportGif(config: QRConfig, logo: LogoSource | null, onProgress?: ExportProgress): Promise<Blob> {
  const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
  const model = buildModel(config, logo);
  const { ctx } = makeCanvas(model);
  const { width, height } = model.layout;
  const transparent = config.bg === "transparent";
  const format = transparent ? "rgba4444" : "rgb565";
  const frames = config.anim === "none" ? 1 : frameCount(config);
  const delay = 1000 / config.fps;
  const gif = GIFEncoder();
  for (let i = 0; i < frames; i++) {
    renderFrame(ctx, model, i / frames, transparent ? {} : { matte: "#ffffff" });
    const { data } = ctx.getImageData(0, 0, width, height);
    const palette = quantize(data, 256, transparent ? { format, oneBitAlpha: true } : { format });
    const index = applyPalette(data, palette, format);
    const transparentIndex = transparent ? palette.findIndex((p) => p[3] === 0) : -1;
    gif.writeFrame(index, width, height, {
      palette,
      delay,
      repeat: gifRepeat(config.loop),
      transparent: transparentIndex >= 0,
      transparentIndex: Math.max(0, transparentIndex),
    });
    onProgress?.((i + 1) / frames, `Encoding frame ${i + 1}/${frames}`);
    if (i % 2 === 1) await nextTick();
  }
  ctx.canvas.width = ctx.canvas.height = 0;
  gif.finish();
  return new Blob([gif.bytes() as BlobPart], { type: "image/gif" });
}

export function pickVideoMime(preferred: "mp4" | "webm"): { mime: string; ext: "mp4" | "webm" } | null {
  if (typeof MediaRecorder === "undefined") return null;
  const mp4 = ["video/mp4;codecs=avc1.42E01E", "video/mp4;codecs=avc1", "video/mp4"];
  const webm = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  const order = preferred === "mp4" ? [...mp4, ...webm] : [...webm, ...mp4];
  for (const mime of order) {
    if (MediaRecorder.isTypeSupported(mime)) return { mime, ext: mime.startsWith("video/mp4") ? "mp4" : "webm" };
  }
  return null;
}

/**
 * Record the animation in real time with MediaRecorder. `loops` repeats the animation so short
 * loops still make a watchable clip.
 */
export async function exportVideo(
  config: QRConfig,
  logo: LogoSource | null,
  preferred: "mp4" | "webm",
  loops: number,
  onProgress?: ExportProgress,
): Promise<{ blob: Blob; ext: "mp4" | "webm" }> {
  const picked = pickVideoMime(preferred);
  if (!picked) throw new Error("Video recording is not supported in this browser.");
  const model = buildModel(config, logo);
  const { canvas, ctx } = makeCanvas(model);
  // Video codecs need even dimensions.
  canvas.width = model.layout.width + (model.layout.width % 2);
  canvas.height = model.layout.height + (model.layout.height % 2);
  const matte = config.bg === "transparent" ? "#ffffff" : undefined;
  renderFrame(ctx, model, 0, { matte });

  const stream = canvas.captureStream(config.fps);
  const recorder = new MediaRecorder(stream, { mimeType: picked.mime, videoBitsPerSecond: 8_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));

  const total = (config.anim === "none" ? 1000 : config.duration) * Math.max(1, loops);
  recorder.start(250);
  const start = performance.now();
  await new Promise<void>((resolve) => {
    const tick = () => {
      const elapsed = performance.now() - start;
      if (elapsed >= total) return resolve();
      const t = config.anim === "none" ? 0 : (elapsed % config.duration) / config.duration;
      renderFrame(ctx, model, t, { matte });
      onProgress?.(elapsed / total, "Recording…");
      setTimeout(tick, 1000 / config.fps);
    };
    tick();
  });
  recorder.stop();
  stream.getTracks().forEach((tr) => tr.stop());
  await done;
  canvas.width = canvas.height = 0;
  onProgress?.(1);
  return { blob: new Blob(chunks, { type: picked.mime.split(";")[0] }), ext: picked.ext };
}
