/**
 * Renders codes with the real canvas renderer (via @napi-rs/canvas) and decodes them with jsQR.
 * Every "safe" animation must decode on every sampled frame, for every module shape.
 */
import { createCanvas, Path2D } from "@napi-rs/canvas";
import jsQR from "jsqr";
import { describe, expect, it } from "vitest";
import { ANIMATIONS, EYE_SHAPES, MODULE_SHAPES, SAFE_ANIMATIONS, sanitizeConfig, type QRConfig } from "@/lib/config";
import { createMatrix, alignmentPositions } from "@/lib/qr/matrix";
import { buildModel, renderFrame } from "@/lib/qr/render";

(globalThis as unknown as { Path2D: typeof Path2D }).Path2D = Path2D;

const FRAMES = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

function decodes(config: QRConfig, t: number) {
  const model = buildModel({ ...config, size: 400 });
  const canvas = createCanvas(model.layout.width, model.layout.height);
  const ctx = canvas.getContext("2d");
  renderFrame(ctx as unknown as CanvasRenderingContext2D, model, t, { matte: "#ffffff" });
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" })?.data === config.data;
}

const DATA = "https://example.com/some/path?q=animated-qr";

describe("alignment patterns", () => {
  it("match the encoder's output for every version", () => {
    for (let v = 2; v <= 40; v++) {
      const pos = alignmentPositions(v);
      expect(pos[0]).toBe(6);
      expect(pos[pos.length - 1]).toBe(v * 4 + 10);
    }
    for (const len of [20, 100, 300, 800]) {
      const m = createMatrix("a".repeat(len), "L");
      for (const [r, c] of m.alignments) {
        for (let dr = -2; dr <= 2; dr++)
          for (let dc = -2; dc <= 2; dc++) {
            const ring = Math.max(Math.abs(dr), Math.abs(dc));
            expect(m.isDark(r + dr, c + dc)).toBe(ring !== 1);
          }
      }
    }
  });
});

describe("scannability", () => {
  for (const module of MODULE_SHAPES) {
    for (const anim of ANIMATIONS) {
      const safe = SAFE_ANIMATIONS.has(anim);
      it(`${module} / ${anim}`, () => {
        const config = sanitizeConfig({ data: DATA, module, anim, ec: "M" });
        const frames = anim === "none" ? [0] : safe ? FRAMES : [0.7];
        const failed = frames.filter((t) => !decodes(config, t));
        expect(failed, `frames that failed to decode`).toEqual([]);
      });
    }
  }

  it.each(EYE_SHAPES)("eye shape %s", (eye) => {
    expect(decodes(sanitizeConfig({ data: DATA, eye, module: "dots" }), 0)).toBe(true);
  });

  it("gradient, frame and label", () => {
    const config = sanitizeConfig({
      data: DATA,
      gradient: "linear-45-0ea5e9-7c3aed",
      frame: "label",
      frameText: "SCAN ME",
      module: "rounded",
      eye: "leaf",
      eyeColor: "#1e1b4b",
    });
    expect(decodes(config, 0)).toBe(true);
  });

  it("inverted (light-on-dark) scan line", () => {
    const config = sanitizeConfig({ data: DATA, fg: "#22d3ee", bg: "#0b1020", anim: "scan", eye: "leaf", eyeColor: "#f0abfc" });
    for (const t of FRAMES) expect(decodes(config, t), `t=${t}`).toBe(true);
  });

  it("logo at the maximum size for each EC level", () => {
    const logo = createCanvas(64, 64);
    const lctx = logo.getContext("2d");
    lctx.fillStyle = "#e11d48";
    lctx.fillRect(0, 0, 64, 64);
    for (const ec of ["L", "M", "Q", "H"]) {
      const config = sanitizeConfig({ data: DATA, ec, logo: "https://example.com/l.png", logoSize: 0.3 });
      const model = buildModel({ ...config, size: 400 }, logo as unknown as HTMLCanvasElement);
      const canvas = createCanvas(model.layout.width, model.layout.height);
      const ctx = canvas.getContext("2d");
      renderFrame(ctx as unknown as CanvasRenderingContext2D, model, 0, { matte: "#ffffff" });
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      expect(jsQR(img.data, img.width, img.height)?.data, `ec=${ec}`).toBe(DATA);
    }
  });

  it("colour cycle keeps contrast on every frame", () => {
    const config = sanitizeConfig({ data: DATA, fg: "#1f2937", anim: "colorCycle" });
    for (const t of FRAMES) expect(decodes(config, t)).toBe(true);
  });
});
