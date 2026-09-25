import type { LogoSource } from "./qr/render";

/** Load a logo image. Remote images must be served with CORS headers so exports keep working. */
export function loadLogo(src: string): Promise<LogoSource> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      // SVGs without intrinsic size report 0×0 — give them a sensible default.
      if (!img.naturalWidth || !img.naturalHeight) {
        img.width = 256;
        img.height = 256;
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error("Logo could not be loaded. Remote logos must allow cross-origin (CORS) access."));
    img.src = src;
  });
}

const MAX_UPLOAD_PX = 256;

/** Read an uploaded file into a compact PNG data URL (downscaled so share links stay short). */
export async function fileToLogoDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Logo must be smaller than 5 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = await loadLogo(url);
    const scale = Math.min(1, MAX_UPLOAD_PX / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
