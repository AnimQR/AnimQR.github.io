"use client";

import { useCallback, useState } from "react";
import type { QRConfig } from "./config";
import { downloadBlob, exportGif, exportRaster, exportSvg, exportVideo, fileBaseName } from "./export";
import type { LogoSource } from "./qr/render";
import { toast } from "./toast";

/** A time at which the animation shows the code fully assembled. */
export function restingTime(anim: string) {
  return anim === "reveal" || anim === "particle" ? 0.7 : 0;
}

export interface Exporter {
  busy: { progress: number; label: string } | null;
  videoLoops: number;
  setVideoLoops(n: number): void;
  /** Build the file for the current format. */
  build(): Promise<{ blob: Blob; filename: string } | null>;
  /** Build and download. */
  run(): Promise<void>;
}

/** One export pipeline shared by the desktop panel and the mobile action bar. */
export function useExporter(config: QRConfig, logo: LogoSource | null): Exporter {
  const [busy, setBusy] = useState<Exporter["busy"]>(null);
  const [videoLoops, setVideoLoops] = useState(3);

  const build = useCallback(async () => {
    const format = config.format;
    setBusy({ progress: 0, label: "Preparing…" });
    const name = fileBaseName(config);
    const onProgress = (progress: number, label = "Exporting…") => setBusy({ progress, label });
    try {
      if (format === "png" || format === "jpeg") {
        const blob = await exportRaster(config, logo, format, restingTime(config.anim));
        return { blob, filename: `${name}.${format === "jpeg" ? "jpg" : "png"}` };
      }
      if (format === "svg") return { blob: await exportSvg(config, logo, restingTime(config.anim)), filename: `${name}.svg` };
      if (format === "gif") return { blob: await exportGif(config, logo, onProgress), filename: `${name}.gif` };
      const { blob, ext } = await exportVideo(config, logo, format, videoLoops, onProgress);
      if (ext !== format) toast(`${format.toUpperCase()} isn't supported by this browser — saved as ${ext.toUpperCase()} instead.`, "info");
      return { blob, filename: `${name}.${ext}` };
    } catch (e) {
      const err = e as Error;
      toast(
        err.name === "SecurityError"
          ? "Export blocked: the logo's server doesn't allow cross-origin use. Upload the logo instead."
          : err.message || "Export failed.",
        "error",
      );
      return null;
    } finally {
      setBusy(null);
    }
  }, [config, logo, videoLoops]);

  const run = useCallback(async () => {
    const file = await build();
    if (!file) return;
    downloadBlob(file.blob, file.filename);
    toast(`Downloaded ${file.filename}`);
  }, [build]);

  return { busy, videoLoops, setVideoLoops, build, run };
}
