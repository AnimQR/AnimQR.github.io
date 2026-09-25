"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PageDefaults } from "@/lib/landing";
import { initialState } from "@/lib/defaults";
import { buildShareQuery, buildShareUrl, LIMITS, type QRConfig } from "@/lib/config";
import { QRCapacityError } from "@/lib/qr/matrix";
import { buildModel, type LogoSource, type RenderModel } from "@/lib/qr/render";
import { checkScannability, type ScanResult } from "@/lib/scan";
import { useStore } from "@/lib/store";
import { AnimationPanel } from "./AnimationPanel";
import { ContentPanel } from "./ContentPanel";
import { DownloadButton, ExportBar, FormatSelect } from "./ExportBar";
import { Preview, useLogo } from "./Preview";
import { StylePanel } from "./StylePanel";
import { canNativeShare, copyText, shareFile, shareLink } from "@/lib/share";
import { toast } from "@/lib/toast";
import { useExporter, type Exporter } from "@/lib/useExporter";
import { Toggle } from "./ui";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const PREVIEW_MAX = 720;
const PLACEHOLDER_DATA = "https://animqr.github.io";

type Tab = "content" | "style" | "animation";

const STEPS: { id: Tab; label: string; short: string }[] = [
  { id: "content", label: "Content", short: "Content" },
  { id: "style", label: "Style", short: "Style" },
  { id: "animation", label: "Animate", short: "Animate" },
];

function useModel(config: QRConfig, logo: LogoSource | null, maxSize?: number) {
  return useMemo((): { model: RenderModel | null; error: string } => {
    try {
      const cfg = maxSize ? { ...config, size: Math.min(config.size, maxSize) } : config;
      return { model: buildModel(cfg, logo), error: "" };
    } catch (e) {
      return {
        model: null,
        error: e instanceof QRCapacityError ? e.message + " Shorten it or lower the error correction." : "Could not generate the code.",
      };
    }
  }, [config, logo, maxSize]);
}

function useScanCheck(config: QRConfig, logo: LogoSource | null, enabled: boolean) {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setChecking(true);
    const id = setTimeout(() => {
      checkScannability(config, logo)
        .then((r) => !cancelled && setResult(r))
        .catch(() => !cancelled && setResult(null))
        .finally(() => !cancelled && setChecking(false));
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [config, logo, enabled]);
  return { result: enabled ? result : null, checking: enabled && checking };
}

function ScanBadge({ result, checking }: { result: ScanResult | null; checking: boolean }) {
  if (checking && !result) return <span className="text-xs text-muted">Checking scannability…</span>;
  if (!result) return null;
  const ok = result.passed === result.total;
  const some = result.passed > 0;
  return (
    <span
      title="Decoded in the browser with jsQR at a phone-camera-like resolution. Always test with a real phone too."
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        ok ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" : some ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-red-500/15 text-red-700 dark:text-red-300"
      } ${checking ? "opacity-60" : ""}`}
    >
      {ok ? "✓ Scannable" : some ? "◐ Partly scannable" : "✗ Not decodable"}
      {result.total > 1 && <span className="opacity-70">({result.passed}/{result.total} frames)</span>}
    </span>
  );
}

export interface GeneratorProps {
  /** Starting content/style when the URL has no parameters. */
  defaults?: PageDefaults;
  /** Restore the visitor's last-used settings (home page only). */
  restoreSaved?: boolean;
  /** Server-rendered SVG of the starting code, shown until the app hydrates (also visible to crawlers). */
  initialSvg?: string;
  /** Accessible description of the pre-rendered code. */
  initialAlt?: string;
}

function shareUrlFor(config: QRConfig) {
  return buildShareUrl(config, `${window.location.origin}${BASE_PATH}/`);
}

function ShareIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5M4 11v4.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V11" />
    </svg>
  );
}

function LinkIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5l-1 1M11.5 8.5a3.5 3.5 0 0 0-5 0L4 11a3.5 3.5 0 0 0 5 5l1-1" />
    </svg>
  );
}

function ShareControls({ config, exporter, disabled }: { config: QRConfig; exporter: Exporter; disabled: boolean }) {
  const { syncUrl, setSyncUrl } = useStore();
  const [nativeShare, setNativeShare] = useState(false);
  useEffect(() => setNativeShare(canNativeShare()), []);

  useEffect(() => {
    if (!syncUrl) return;
    const id = setTimeout(() => {
      const q = buildShareQuery(config);
      window.history.replaceState(null, "", q ? `?${q}` : window.location.pathname);
    }, 300);
    return () => clearTimeout(id);
  }, [config, syncUrl]);

  const shareImage = async () => {
    const file = await exporter.build();
    if (!file) return;
    if (!(await shareFile(file.blob, file.filename))) toast("This browser can't share files — use Download instead.", "info");
  };

  const droppedLogo = config.logo.startsWith("data:") && config.logo.length > LIMITS.logoInLinkMax;
  const btn =
    "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 px-3 text-sm font-medium transition hover:border-muted active:scale-[0.98] disabled:opacity-50";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} disabled={disabled} onClick={() => copyText(shareUrlFor(config), "Link copied — anyone who opens it sees this exact code")}>
          <LinkIcon /> Copy link
        </button>
        {nativeShare && (
          <button type="button" className={btn} disabled={disabled || !!exporter.busy} onClick={shareImage}>
            <ShareIcon /> Share image
          </button>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Toggle label="Keep the address bar in sync" checked={syncUrl} onChange={setSyncUrl} />
      </div>
      {droppedLogo && <p className="text-xs text-muted">Uploaded logos are too large for links — use a logo URL to share it.</p>}
    </div>
  );
}

/** Always-visible download/share bar on phones and tablets. */
function MobileActionBar({ config, exporter, disabled }: { config: QRConfig; exporter: Exporter; disabled: boolean }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-xl items-center gap-2">
        <FormatSelect config={config} compact className="w-[5.75rem] shrink-0" />
        <DownloadButton exporter={exporter} format={config.format} disabled={disabled} compact className="flex-1" />
        <button
          type="button"
          onClick={() => shareLink(shareUrlFor(config))}
          disabled={disabled}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 transition active:scale-95 disabled:opacity-50"
          aria-label="Share link to this code"
        >
          <ShareIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid h-11 w-11 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

export function Generator({ defaults, restoreSaved = true, initialSvg, initialAlt }: GeneratorProps) {
  const store = useStore();
  const { config, hydrated, embed, fromUrl, urlWarnings, hydrate, reset, pageDefaults, undo, redo, past, future } = store;
  const [tab, setTab] = useState<Tab>("content");
  const [playing, setPlaying] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hydrate(window.location.search, defaults, restoreSaved);
    const onPop = () => hydrate(window.location.search, defaults, restoreSaved);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [hydrate, defaults, restoreSaved]);

  const { logo, error: logoError } = useLogo(config.logo);
  const hasData = config.data.trim() !== "";
  // Show a faded placeholder code while the input is empty.
  const shown = useMemo(() => (hasData ? config : { ...config, data: PLACEHOLDER_DATA }), [config, hasData]);
  const { model, error } = useModel(shown, logo, PREVIEW_MAX);
  const scan = useScanCheck(config, logo, hydrated && hasData && !error && !embed);
  const exporter = useExporter(config, logo);
  const exportDisabled = !hasData || !!error;

  useEffect(() => {
    if (!embed) return;
    document.documentElement.classList.add("embed");
    // Embedded codes are not pages in their own right.
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
  }, [embed]);

  // Reserve room for the fixed mobile action bar.
  useEffect(() => {
    if (!hydrated || embed) return;
    document.documentElement.classList.add("has-action-bar");
    return () => document.documentElement.classList.remove("has-action-bar");
  }, [hydrated, embed]);

  // Show a mini preview in the sticky editor bar once the big preview scrolls away (phones).
  useEffect(() => {
    const el = previewRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setPreviewVisible(e.intersectionRatio > 0.25), { threshold: [0, 0.25, 0.5] });
    io.observe(el);
    return () => io.disconnect();
  }, [hydrated, embed]);

  // Undo / redo shortcuts (text fields keep their own native undo).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest("input[type=text], input[type=url], input[type=email], input[type=tel], input:not([type]), textarea")) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const goTo = useCallback((next: Tab) => {
    setTab(next);
    const bar = editorRef.current;
    if (bar && bar.getBoundingClientRect().top < 0) bar.scrollIntoView({ block: "start", behavior: "smooth" });
  }, []);

  const scrollToPreview = () => previewRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });

  if (!hydrated) {
    return (
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-10">
        <div className="lg:order-2">
          <div className="checkerboard flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-line p-6">
            {initialSvg ? (
              <div
                role="img"
                aria-label={initialAlt ?? "QR code preview"}
                className="aspect-square w-full max-w-full drop-shadow-xl [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: initialSvg }}
              />
            ) : (
              <span className="text-muted">Loading…</span>
            )}
          </div>
        </div>
        <div className="flex min-h-[40vh] items-start text-sm text-muted lg:order-1">Loading the editor…</div>
      </div>
    );
  }

  if (embed) {
    return (
      <div className="flex min-h-screen items-center justify-center p-2">
        {model && hasData ? (
          <Preview model={model} duration={config.duration} playing className="max-h-[calc(100vh-1rem)] w-auto" />
        ) : (
          <p className="text-sm text-muted">{error || "No data provided."}</p>
        )}
      </div>
    );
  }

  const stepIndex = STEPS.findIndex((s) => s.id === tab);
  const nextStep = STEPS[stepIndex + 1];
  const prevStep = STEPS[stepIndex - 1];
  const dirty = JSON.stringify(config) !== JSON.stringify(initialState(pageDefaults).config);
  const animated = config.anim !== "none" && hasData;
  const stepAction = (cls: string) =>
    nextStep ? (
      <button
        type="button"
        onClick={() => goTo(nextStep.id)}
        className={`inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-accent bg-accent/10 px-5 text-sm font-semibold transition hover:bg-accent/20 active:scale-[0.98] ${cls}`}
      >
        Next: {nextStep.label} →
      </button>
    ) : (
      <DownloadButton exporter={exporter} format={config.format} disabled={exportDisabled} className={`whitespace-nowrap px-6 ${cls}`} />
    );
  const historyButtons = (
    <>
              <IconButton label="Undo (Ctrl+Z)" onClick={undo} disabled={past.length === 0}>
                <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 5 3 9l4 4" /><path d="M3 9h9a5 5 0 0 1 0 10h-2" /></svg>
              </IconButton>
              <IconButton label="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={future.length === 0}>
                <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m13 5 4 4-4 4" /><path d="M17 9H8a5 5 0 0 0 0 10h2" /></svg>
              </IconButton>
              <IconButton
                label="Start over"
                disabled={!dirty}
                onClick={() => {
                  reset();
                  setTab("content");
                  toast("Started over — use Undo to go back", "info");
                }}
              >
                <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 10a6.5 6.5 0 1 0 2-4.7L3 7.5" /><path d="M3 3v4.5h4.5" /></svg>
              </IconButton>
    </>
  );

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-10 lg:pb-16">
      {/* Preview column (first on mobile) */}
      <div className="lg:order-2">
        <div className="space-y-4 lg:sticky lg:top-6">
          {fromUrl && !dismissed && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-accent/40 bg-accent/10 py-1 pl-3 pr-1 text-sm">
              <span>✨ Generated from a link</span>
              <button type="button" className="grid h-10 w-10 place-items-center text-muted hover:text-fg" onClick={() => setDismissed(true)} aria-label="Dismiss">
                ×
              </button>
            </div>
          )}
          {urlWarnings.map((w) => (
            <p key={w} className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
              {w}
            </p>
          ))}

          <div
            ref={previewRef}
            className="checkerboard relative mx-auto flex aspect-square max-h-[min(72vh,34rem)] w-full items-center justify-center overflow-hidden rounded-2xl border border-line p-5 sm:p-6"
          >
            {model ? (
              <button
                type="button"
                onClick={() => animated && setPlaying((p) => !p)}
                className={`flex h-full w-full items-center justify-center ${animated ? "cursor-pointer" : "cursor-default"}`}
                aria-label={animated ? (playing ? "Pause animation" : "Play animation") : "QR code preview"}
                tabIndex={animated ? 0 : -1}
              >
                <Preview
                  model={model}
                  duration={config.duration}
                  playing={playing}
                  className={`max-h-full w-auto drop-shadow-xl transition-opacity ${hasData ? "" : "opacity-20"}`}
                />
              </button>
            ) : (
              <p className="max-w-xs text-center text-sm text-red-700 dark:text-red-300">{error}</p>
            )}
            {!hasData && model && (
              <p className="pointer-events-none absolute inset-x-6 bottom-6 text-center text-sm font-medium">Enter some content to generate your code</p>
            )}
            {animated && !playing && (
              <span aria-hidden className="pointer-events-none absolute grid h-14 w-14 place-items-center rounded-full bg-black/55 text-xl text-white">
                ▶
              </span>
            )}
          </div>

          <div className="flex min-h-11 flex-wrap items-center justify-between gap-2">
            <ScanBadge {...scan} />
            {animated && (
              <button type="button" className="inline-flex min-h-11 items-center gap-1.5 px-1 text-sm text-muted hover:text-fg" onClick={() => setPlaying((p) => !p)}>
                {playing ? "❚❚ Pause" : "▶ Play"}
              </button>
            )}
          </div>
          {logoError && <p className="text-xs text-amber-700 dark:text-amber-300">{logoError}</p>}

          <div className="hidden lg:block">
            <ExportBar config={config} exporter={exporter} disabled={exportDisabled} />
          </div>
          <ShareControls config={config} exporter={exporter} disabled={exportDisabled} />
        </div>
      </div>

      {/* Editor column */}
      <div className="lg:order-1" ref={editorRef}>
        <div className="sticky top-0 z-30 -mx-4 mb-6 border-b border-line bg-bg/95 px-2 backdrop-blur sm:px-4 lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
          <div className="flex items-center gap-1">
            {!previewVisible && model && (
              <button
                type="button"
                onClick={scrollToPreview}
                className="-ml-1 grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line bg-white p-0.5 lg:hidden"
                aria-label="Show the full preview"
              >
                <Preview model={model} duration={config.duration} playing={false} className="h-full w-auto" />
              </button>
            )}
            <div role="tablist" aria-label="Editor steps" className="grid min-w-0 flex-1 grid-cols-3 sm:flex sm:gap-1">
              {STEPS.map((t, i) => (
                <button
                  key={t.id}
                  id={`tab-${t.id}`}
                  role="tab"
                  type="button"
                  aria-selected={tab === t.id}
                  aria-controls="settings-panel"
                  onClick={() => setTab(t.id)}
                  className={`-mb-px flex min-h-12 min-w-0 items-center justify-center gap-1.5 border-b-2 px-1 text-sm font-medium transition sm:justify-start sm:px-3 ${
                    tab === t.id ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`hidden h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold min-[400px]:grid ${
                      tab === t.id ? "bg-accent text-white" : i < stepIndex ? "bg-accent/20 text-fg" : "bg-surface-2 text-muted ring-1 ring-line"
                    }`}
                  >
                    {i < stepIndex ? "✓" : i + 1}
                  </span>
                  <span className="truncate">{t.short}</span>
                </button>
              ))}
            </div>
            <div className="hidden shrink-0 items-center sm:flex">{historyButtons}</div>
          </div>
        </div>

        <div role="tabpanel" id="settings-panel" aria-labelledby={`tab-${tab}`} className="panel-in" key={tab}>
          {tab === "content" && <ContentPanel />}
          {tab === "style" && <StylePanel />}
          {tab === "animation" && <AnimationPanel />}
        </div>

        {/* Step navigation: on phones the primary action gets its own full-width row. */}
        <div className="mt-8 border-t border-line pt-4 sm:pt-5">
          <div className="flex items-center justify-between gap-2">
            {prevStep ? (
              <button type="button" onClick={() => goTo(prevStep.id)} className="inline-flex min-h-12 items-center gap-1 rounded-xl px-2 text-sm font-medium text-muted hover:text-fg sm:px-3">
                ← {prevStep.label}
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center sm:hidden">{historyButtons}</div>
            <div className="hidden sm:block">{stepAction("")}</div>
          </div>
          <div className="mt-3 sm:hidden">{stepAction("w-full")}</div>
        </div>
      </div>

      <MobileActionBar config={config} exporter={exporter} disabled={exportDisabled} />
    </div>
  );
}
