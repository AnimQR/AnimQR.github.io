"use client";

import { FORMATS, type ExportFormat, type QRConfig } from "@/lib/config";
import { pickVideoMime } from "@/lib/export";
import { useStore } from "@/lib/store";
import type { Exporter } from "@/lib/useExporter";
import { Select } from "./ui";

export const FORMAT_LABELS: Record<ExportFormat, string> = {
  png: "PNG image",
  svg: "SVG vector",
  jpeg: "JPEG image",
  gif: "Animated GIF",
  webm: "WebM video",
  mp4: "MP4 video",
};

const SHORT_LABELS: Record<ExportFormat, string> = { png: "PNG", svg: "SVG", jpeg: "JPEG", gif: "GIF", webm: "WebM", mp4: "MP4" };

export function DownloadIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10 3v10m0 0-4-4m4 4 4-4M4 16h12" />
    </svg>
  );
}

function Spinner() {
  return <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />;
}

export function DownloadButton({
  exporter,
  format,
  disabled,
  className = "",
  compact = false,
}: {
  exporter: Exporter;
  format: ExportFormat;
  disabled: boolean;
  className?: string;
  compact?: boolean;
}) {
  const { busy, run } = exporter;
  return (
    <button
      type="button"
      onClick={run}
      disabled={disabled || !!busy}
      aria-busy={!!busy}
      aria-label={compact && !busy ? `Download ${SHORT_LABELS[format]}` : undefined}
      className={`relative inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-accent px-4 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60 ${className}`}
    >
      {busy && <span aria-hidden className="absolute inset-y-0 left-0 bg-white/15 transition-[width]" style={{ width: `${busy.progress * 100}%` }} />}
      <span className="relative inline-flex items-center gap-2 whitespace-nowrap">
        {busy ? <Spinner /> : <DownloadIcon />}
        {busy
          ? compact
            ? `${Math.round(busy.progress * 100)}%`
            : `${busy.label} ${Math.round(busy.progress * 100)}%`
          : compact
            ? "Download"
            : `Download ${SHORT_LABELS[format]}`}
      </span>
    </button>
  );
}

export function FormatSelect({ config, className = "", compact = false }: { config: QRConfig; className?: string; compact?: boolean }) {
  const update = useStore((s) => s.update);
  return (
    <div className={className}>
      <Select
        label="Download format"
        value={config.format}
        onChange={(f) => update({ format: f })}
        options={FORMATS.map((f) => ({ value: f, label: compact ? SHORT_LABELS[f] : FORMAT_LABELS[f] }))}
      />
    </div>
  );
}

/** Full export panel (desktop sidebar and below the preview). */
export function ExportBar({ config, exporter, disabled }: { config: QRConfig; exporter: Exporter; disabled: boolean }) {
  const format = config.format;
  const isVideo = format === "webm" || format === "mp4";
  const isStatic = format === "png" || format === "svg" || format === "jpeg";
  const videoSupport = typeof window !== "undefined" && isVideo ? pickVideoMime(format as "mp4" | "webm") : undefined;
  const { videoLoops, setVideoLoops, busy } = exporter;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <FormatSelect config={config} className="min-w-36 flex-1" />
        <DownloadButton exporter={exporter} format={format} disabled={disabled} className="flex-1" />
      </div>
      {busy && (
        <div className="h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Export progress" aria-valuenow={Math.round(busy.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-accent transition-[width]" style={{ width: `${busy.progress * 100}%` }} />
        </div>
      )}
      {isVideo && (
        <label className="flex items-center justify-between gap-3 text-xs text-muted">
          <span>
            Length: {videoLoops} loop{videoLoops > 1 ? "s" : ""} ({(((config.anim === "none" ? 1000 : config.duration) * videoLoops) / 1000).toFixed(1)}s, recorded in real time)
          </span>
          <input type="range" min={1} max={10} value={videoLoops} onChange={(e) => setVideoLoops(Number(e.target.value))} className="h-8 w-28 accent-[var(--color-accent)]" aria-label="Video length in loops" />
        </label>
      )}
      {videoSupport === null && <p className="text-xs text-amber-700 dark:text-amber-300">This browser can&apos;t record video. Try GIF, or a recent Chrome, Edge, Firefox or Safari.</p>}
      {isStatic && config.anim !== "none" && <p className="text-xs text-muted">Static formats save a single, fully assembled frame.</p>}
    </div>
  );
}
