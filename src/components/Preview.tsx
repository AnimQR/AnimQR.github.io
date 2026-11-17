"use client";

import { useEffect, useRef, useState } from "react";
import { renderFrame, type RenderModel } from "@/lib/qr/render";
import { loadLogo } from "@/lib/logo";
import type { LogoSource } from "@/lib/qr/render";
import { restingTime } from "@/lib/useExporter";

export function useLogo(src: string) {
  const [state, setState] = useState<{ src: string; logo: LogoSource | null; error: string }>({ src: "", logo: null, error: "" });
  useEffect(() => {
    if (!src) {
      setState({ src, logo: null, error: "" });
      return;
    }
    let cancelled = false;
    loadLogo(src)
      .then((logo) => !cancelled && setState({ src, logo, error: "" }))
      .catch((e: Error) => !cancelled && setState({ src, logo: null, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [src]);
  const loading = !!src && state.src !== src;
  return { logo: state.src === src ? state.logo : null, error: state.src === src ? state.error : "", loading };
}

export function Preview({
  model,
  duration,
  playing,
  className = "",
  maxHeight,
}: {
  model: RenderModel;
  duration: number;
  playing: boolean;
  className?: string;
  /**
   * Largest height the code may take, as a CSS length. The width is derived from it explicitly
   * (never via percentage heights, which iOS Safari resolves against the canvas's intrinsic size).
   */
  maxHeight?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startRef = useRef<number>(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = model.layout.width;
    canvas.height = model.layout.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const animated = model.config.anim !== "none";
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (!animated || !playing || reduceMotion) {
      // Static frame: pick a moment where every animation shows the complete code.
      renderFrame(ctx, model, animated ? restingTime(model.config.anim) : 0);
      return;
    }
    let raf = 0;
    const frameMs = 1000 / model.config.fps;
    let last = -Infinity;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      // Preview at the export frame rate so what you see is what you get.
      if (now - last < frameMs - 1) return;
      last = now;
      const t = (((now - startRef.current) % duration) + duration) % duration / duration;
      renderFrame(ctx, model, Math.floor(t * model.config.fps * (duration / 1000)) / (model.config.fps * (duration / 1000)));
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [model, duration, playing]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`QR code for: ${model.config.data}`}
      className={`block h-auto max-w-full ${className}`}
      style={{
        aspectRatio: `${model.layout.width} / ${model.layout.height}`,
        width: maxHeight ? `min(100%, calc(${maxHeight} * ${model.layout.width / model.layout.height}))` : "100%",
      }}
    />
  );
}

/**
 * Small static thumbnail with fixed pixel dimensions (used in the sticky editor bar).
 * Rendered from its own low-resolution model so it is cheap and layout-independent.
 */
export function MiniPreview({ model, size = 40 }: { model: RenderModel; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height } = model.layout;
  const scale = Math.min(size / width, size / height);
  const cssW = Math.round(width * scale);
  const cssH = Math.round(height * scale);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Render at full layout size off-screen, then downscale for a crisp thumbnail.
    const off = document.createElement("canvas");
    off.width = width;
    off.height = height;
    const octx = off.getContext("2d");
    if (!octx) return;
    renderFrame(octx, model, model.config.anim !== "none" ? restingTime(model.config.anim) : 0, { matte: "#ffffff" });
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
    off.width = off.height = 0; // release memory promptly (iOS caps total canvas memory)
  }, [model, cssW, cssH, width, height]);

  return <canvas ref={canvasRef} aria-hidden className="block shrink-0" style={{ width: cssW, height: cssH }} />;
}

export { restingTime } from "@/lib/useExporter";
