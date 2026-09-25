"use client";

import { useEffect, useMemo, useState } from "react";
import type { PageDefaults } from "@/lib/landing";
import { initialState } from "@/lib/defaults";
import { buildShareQuery, buildShareUrl, LIMITS, type QRConfig } from "@/lib/config";
import { QRCapacityError } from "@/lib/qr/matrix";
import { buildModel, type LogoSource, type RenderModel } from "@/lib/qr/render";
import { checkScannability, type ScanResult } from "@/lib/scan";
import { useStore } from "@/lib/store";
import { AnimationPanel } from "./AnimationPanel";
import { ContentPanel } from "./ContentPanel";
import { ExportBar } from "./ExportBar";
import { Preview, useLogo } from "./Preview";
import { StylePanel } from "./StylePanel";
import { Button, Toggle } from "./ui";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const PREVIEW_MAX = 720;
const PLACEHOLDER_DATA = "https://animqr.github.io";

type Tab = "content" | "style" | "animation";

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

function ShareControls({ config }: { config: QRConfig }) {
  const { syncUrl, setSyncUrl } = useStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!syncUrl) return;
    const id = setTimeout(() => {
      const q = buildShareQuery(config);
      window.history.replaceState(null, "", q ? `?${q}` : window.location.pathname);
    }, 300);
    return () => clearTimeout(id);
  }, [config, syncUrl]);

  const copy = async () => {
    const url = buildShareUrl(config, `${window.location.origin}${BASE_PATH}/`);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link", url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const droppedLogo = config.logo.startsWith("data:") && config.logo.length > LIMITS.logoInLinkMax;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={copy} disabled={!config.data} className="flex-1">
          {copied ? "✓ Link copied" : "🔗 Copy shareable link"}
        </Button>
        <Toggle label="Sync to URL" checked={syncUrl} onChange={setSyncUrl} />
      </div>
      {droppedLogo && <p className="text-xs text-muted">Uploaded logos are too large for links — use a logo URL to share it.</p>}
    </div>
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

export function Generator({ defaults, restoreSaved = true, initialSvg, initialAlt }: GeneratorProps) {
  const store = useStore();
  const { config, hydrated, embed, fromUrl, urlWarnings, hydrate, reset, pageDefaults } = store;
  const [tab, setTab] = useState<Tab>("content");
  const [playing, setPlaying] = useState(true);
  const [dismissed, setDismissed] = useState(false);

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

  useEffect(() => {
    if (!embed) return;
    document.documentElement.classList.add("embed");
    // Embedded codes are not pages in their own right.
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
  }, [embed]);

  if (!hydrated) {
    return (
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-10">
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

  const tabs: { id: Tab; label: string }[] = [
    { id: "content", label: "Content" },
    { id: "style", label: "Style" },
    { id: "animation", label: "Animation" },
  ];

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-10">
      {/* Preview column (first on mobile) */}
      <div className="lg:order-2">
        <div className="space-y-4 lg:sticky lg:top-6">
          {fromUrl && !dismissed && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
              <span>✨ Generated from URL</span>
              <button type="button" className="text-muted hover:text-fg" onClick={() => setDismissed(true)} aria-label="Dismiss">
                ×
              </button>
            </div>
          )}
          {urlWarnings.map((w) => (
            <p key={w} className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
              {w}
            </p>
          ))}

          <div className="checkerboard relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-line p-6">
            {model ? (
              <Preview
                model={model}
                duration={config.duration}
                playing={playing}
                className={`max-h-full w-auto drop-shadow-xl transition-opacity ${hasData ? "" : "opacity-20"}`}
              />
            ) : (
              <p className="max-w-xs text-center text-sm text-red-700 dark:text-red-300">{error}</p>
            )}
            {!hasData && model && (
              <p className="absolute inset-x-6 bottom-6 text-center text-sm font-medium">Enter some content to generate your code</p>
            )}
          </div>

          <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
            <ScanBadge {...scan} />
            {config.anim !== "none" && hasData && (
              <Button variant="ghost" className="min-h-0 px-0 py-0" onClick={() => setPlaying((p) => !p)}>
                {playing ? "❚❚ Pause" : "▶ Play"}
              </Button>
            )}
          </div>
          {logoError && <p className="text-xs text-amber-700 dark:text-amber-300">{logoError}</p>}

          <ExportBar config={config} logo={logo} disabled={!hasData || !!error} />
          <ShareControls config={config} />
        </div>
      </div>

      {/* Controls column */}
      <div className="lg:order-1">
        <div className="sticky top-0 z-10 -mx-4 mb-6 flex items-center gap-1 border-b border-line bg-bg/90 px-4 backdrop-blur lg:static lg:mx-0 lg:bg-transparent lg:px-0">
          <div role="tablist" aria-label="Settings" className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                role="tab"
                type="button"
                aria-selected={tab === t.id}
                aria-controls="settings-panel"
                onClick={() => setTab(t.id)}
                className={`-mb-px min-h-12 border-b-2 px-4 text-sm font-medium transition ${
                  tab === t.id ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          {JSON.stringify(config) !== JSON.stringify(initialState(pageDefaults).config) && (
            <button type="button" onClick={reset} className="min-h-10 text-xs text-muted hover:text-fg">
              Reset
            </button>
          )}
        </div>
        <div role="tabpanel" id="settings-panel" aria-labelledby={`tab-${tab}`}>
          {tab === "content" && <ContentPanel />}
          {tab === "style" && <StylePanel />}
          {tab === "animation" && <AnimationPanel />}
        </div>
      </div>
    </div>
  );
}
