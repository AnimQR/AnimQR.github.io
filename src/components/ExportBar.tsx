"use client";

import { useState } from "react";
import { FORMATS, type ExportFormat, type QRConfig } from "@/lib/config";
import { downloadBlob, exportGif, exportRaster, exportSvg, exportVideo, fileBaseName, pickVideoMime } from "@/lib/export";
import type { LogoSource } from "@/lib/qr/render";
import { useStore } from "@/lib/store";
import { restingTime } from "./Preview";
import { Button, Select } from "./ui";

const FORMAT_LABELS: Record<ExportFormat, string> = {
  png: "PNG image",
  svg: "SVG vector",
  jpeg: "JPEG image",
  gif: "Animated GIF",
  webm: "WebM video",
  mp4: "MP4 video",
};

export function ExportBar({ config, logo, disabled }: { config: QRConfig; logo: LogoSource | null; disabled: boolean }) {
  const update = useStore((s) => s.update);
  const [busy, setBusy] = useState<{ progress: number; label: string } | null>(null);
  const [message, setMessage] = useState("");
  const [videoLoops, setVideoLoops] = useState(3);
  const format = config.format;
  const isVideo = format === "webm" || format === "mp4";
  const isStatic = format === "png" || format === "svg" || format === "jpeg";

  const run = async () => {
    setMessage("");
    setBusy({ progress: 0, label: "Preparing…" });
    const name = fileBaseName(config);
    const onProgress = (progress: number, label = "Exporting…") => setBusy({ progress, label });
    try {
      if (format === "png" || format === "jpeg") {
        downloadBlob(await exportRaster(config, logo, format, restingTime(config.anim)), `${name}.${format === "jpeg" ? "jpg" : "png"}`);
      } else if (format === "svg") {
        downloadBlob(await exportSvg(config, logo, restingTime(config.anim)), `${name}.svg`);
      } else if (format === "gif") {
        downloadBlob(await exportGif(config, logo, onProgress), `${name}.gif`);
      } else {
        const { blob, ext } = await exportVideo(config, logo, format, videoLoops, onProgress);
        downloadBlob(blob, `${name}.${ext}`);
        if (ext !== format) setMessage(`${format.toUpperCase()} recording isn't supported by this browser — saved as ${ext.toUpperCase()} instead.`);
      }
    } catch (e) {
      const err = e as Error;
      setMessage(
        err.name === "SecurityError"
          ? "Export blocked: the logo is hosted on a server that doesn't allow cross-origin use. Upload it instead."
          : err.message,
      );
    } finally {
      setBusy(null);
    }
  };

  const videoSupport = typeof window !== "undefined" && isVideo ? pickVideoMime(format as "mp4" | "webm") : undefined;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="min-w-40 flex-1">
          <Select
            label="Download format"
            value={format}
            onChange={(f) => update({ format: f })}
            options={FORMATS.map((f) => ({ value: f, label: FORMAT_LABELS[f] }))}
          />
        </div>
        <Button variant="primary" onClick={run} disabled={disabled || !!busy} className="flex-1">
          {busy ? `${busy.label} ${Math.round(busy.progress * 100)}%` : `Download ${format.toUpperCase()}`}
        </Button>
      </div>
      {busy && (
        <div className="h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(busy.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-accent transition-[width]" style={{ width: `${busy.progress * 100}%` }} />
        </div>
      )}
      {isVideo && (
        <label className="flex items-center justify-between gap-2 text-xs text-muted">
          <span>Video length: {videoLoops} loop{videoLoops > 1 ? "s" : ""} ({((config.anim === "none" ? 1000 : config.duration) * videoLoops / 1000).toFixed(1)}s, recorded in real time)</span>
          <input type="range" min={1} max={10} value={videoLoops} onChange={(e) => setVideoLoops(Number(e.target.value))} className="w-28 accent-[var(--color-accent)]" />
        </label>
      )}
      {videoSupport === null && <p className="text-xs text-amber-700 dark:text-amber-300">This browser can&apos;t record video. Try GIF, or a recent Chrome, Edge, Firefox or Safari.</p>}
      {isStatic && config.anim !== "none" && <p className="text-xs text-muted">Static formats save a single, fully assembled frame.</p>}
      {format === "svg" && config.logo && !config.logo.startsWith("data:") && (
        <p className="text-xs text-muted">The SVG references the logo by URL.</p>
      )}
      {message && <p className="text-xs text-amber-700 dark:text-amber-300">{message}</p>}
    </div>
  );
}
