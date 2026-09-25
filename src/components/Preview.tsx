"use client";

import { useEffect, useRef, useState } from "react";
import { renderFrame, type RenderModel } from "@/lib/qr/render";
import { loadLogo } from "@/lib/logo";
import type { LogoSource } from "@/lib/qr/render";

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
}: {
  model: RenderModel;
  duration: number;
  playing: boolean;
  className?: string;
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
      className={`h-auto max-w-full ${className}`}
      style={{ aspectRatio: `${model.layout.width} / ${model.layout.height}` }}
    />
  );
}

/** A time at which the animation shows the code fully assembled. */
export function restingTime(anim: string) {
  return anim === "reveal" || anim === "particle" ? 0.7 : 0;
}
