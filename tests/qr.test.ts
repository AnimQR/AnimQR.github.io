import jsQR from "jsqr";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, sanitizeConfig, type ECLevel } from "@/lib/config";
import { moduleState } from "@/lib/qr/animations";
import { createMatrix, QRCapacityError } from "@/lib/qr/matrix";
import { buildModel, renderSvg } from "@/lib/qr/render";

/** Rasterise a matrix with square modules and decode it with jsQR. */
function decode(data: string, ec: ECLevel) {
  const matrix = createMatrix(data, ec);
  const scale = 4;
  const margin = 4;
  const size = (matrix.count + margin * 2) * scale;
  const px = new Uint8ClampedArray(size * size * 4).fill(255);
  for (let r = 0; r < matrix.count; r++)
    for (let c = 0; c < matrix.count; c++)
      if (matrix.isDark(r, c))
        for (let y = 0; y < scale; y++)
          for (let x = 0; x < scale; x++) {
            const i = (((r + margin) * scale + y) * size + (c + margin) * scale + x) * 4;
            px[i] = px[i + 1] = px[i + 2] = 0;
          }
  return jsQR(px, size, size)?.data;
}

describe("QR matrix", () => {
  it.each([
    ["https://example.com", "L"],
    ["Hello World", "M"],
    ["WIFI:T:WPA;S:MyNetwork;P:password123;;", "Q"],
    ["Unicode ✓ ünïcödé 日本語", "H"],
  ] as const)("encodes %s at %s", (data, ec) => {
    expect(decode(data, ec)).toBe(data);
  });

  it("throws a capacity error for oversized content", () => {
    expect(() => createMatrix("x".repeat(2000), "H")).toThrow(QRCapacityError);
  });

  it("identifies finder patterns", () => {
    const m = createMatrix("hi", "M");
    expect(m.isEye(0, 0)).toBe(true);
    expect(m.isEye(0, m.count - 1)).toBe(true);
    expect(m.isEye(m.count - 1, 0)).toBe(true);
    expect(m.isEye(m.count - 1, m.count - 1)).toBe(false);
  });
});

describe("renderSvg", () => {
  it("renders every module shape, eye and frame", () => {
    for (const module of ["square", "rounded", "dots", "diamond", "star", "vbars", "hbars"])
      for (const eye of ["square", "rounded", "circle", "leaf"])
        for (const frame of ["none", "square", "rounded", "label"]) {
          const svg = renderSvg(buildModel(sanitizeConfig({ data: "hello", module, eye, frame })));
          expect(svg.startsWith("<svg")).toBe(true);
          expect(svg).not.toContain("NaN");
        }
  });

  it("escapes frame text", () => {
    const svg = renderSvg(buildModel(sanitizeConfig({ data: "x", frame: "label", frameText: "<script>&" })));
    expect(svg).toContain("&lt;script&gt;&amp;");
    expect(svg).not.toContain("<script>");
  });

  it("emits a gradient definition", () => {
    const svg = renderSvg(buildModel(sanitizeConfig({ data: "x", gradient: "linear-45-ff0000-0000ff" })));
    expect(svg).toContain("<linearGradient");
    expect(svg).toContain('fill="url(#fg)"');
  });

  it("uses a larger canvas for the label frame", () => {
    const m = buildModel({ ...DEFAULT_CONFIG, data: "x", frame: "label" });
    expect(m.layout.height).toBeGreaterThan(m.layout.width);
  });
});

describe("animations", () => {
  const safe = ["pulse", "wave", "fade", "rotate", "scan"] as const;
  it.each(safe)("%s keeps every module visible", (anim) => {
    for (let t = 0; t < 1; t += 0.05)
      for (let r = 0; r < 25; r += 3)
        for (let c = 0; c < 25; c += 3) {
          const s = moduleState(anim, "square", r, c, 25, t);
          expect(s.scale).toBeGreaterThanOrEqual(0.75);
          expect(s.alpha).toBeGreaterThanOrEqual(0.55);
          expect(Math.abs(s.dx) + Math.abs(s.dy)).toBeLessThan(0.25);
        }
  });

  it.each(["reveal", "particle"] as const)("%s is fully assembled at its resting time", (anim) => {
    for (let r = 0; r < 25; r++)
      for (let c = 0; c < 25; c++) {
        const s = moduleState(anim, "square", r, c, 25, 0.7);
        expect(s.alpha).toBeGreaterThan(0.95);
        expect(Math.abs(s.dx) + Math.abs(s.dy)).toBeLessThan(0.01);
      }
  });
});
