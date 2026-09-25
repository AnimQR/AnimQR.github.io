import { describe, expect, it } from "vitest";
import {
  buildShareQuery,
  DEFAULT_CONFIG,
  encodeCompressed,
  formatGradient,
  parseGradient,
  parseUrlParams,
  sanitizeColor,
  sanitizeConfig,
  sanitizeLogo,
} from "@/lib/config";

describe("sanitizeColor", () => {
  it.each([
    ["#ff0000", "#ff0000"],
    ["ff0000", "#ff0000"],
    ["#F00", "#ff0000"],
    ["#f008", "#ff000088"],
    [" #ABCDEF ", "#abcdef"],
  ])("%s → %s", (input, out) => expect(sanitizeColor(input)).toBe(out));

  it.each(["red", "#ggg", "url(x)", "#12345", "", "javascript:alert(1)"])("rejects %s", (v) =>
    expect(sanitizeColor(v)).toBeUndefined(),
  );

  it("only accepts transparent when allowed", () => {
    expect(sanitizeColor("transparent")).toBeUndefined();
    expect(sanitizeColor("transparent", true)).toBe("transparent");
  });
});

describe("gradients", () => {
  it("parses the documented notation", () => {
    expect(parseGradient("linear-45-#ff0-#f0f")).toEqual({ type: "linear", angle: 45, stops: ["#ffff00", "#ff00ff"] });
    expect(parseGradient("radial-ff0000-0000ff")).toEqual({ type: "radial", angle: 0, stops: ["#ff0000", "#0000ff"] });
    expect(parseGradient("linear-ff0000-0000ff")).toEqual({ type: "linear", angle: 0, stops: ["#ff0000", "#0000ff"] });
    expect(parseGradient("none")).toBeNull();
  });
  it("rejects garbage", () => {
    expect(parseGradient("conic-1-2")).toBeUndefined();
    expect(parseGradient("linear-45-#ff0")).toBeUndefined();
  });
  it("round-trips", () => {
    const g = { type: "linear" as const, angle: 30, stops: ["#112233", "#445566"] as [string, string] };
    expect(parseGradient(formatGradient(g))).toEqual(g);
  });
});

describe("sanitizeLogo", () => {
  it("allows http(s) and image data URLs", () => {
    expect(sanitizeLogo("https://example.com/a.png")).toBe("https://example.com/a.png");
    expect(sanitizeLogo("data:image/png;base64,AAAA")).toBe("data:image/png;base64,AAAA");
  });
  it("blocks other schemes", () => {
    expect(sanitizeLogo("javascript:alert(1)")).toBeUndefined();
    expect(sanitizeLogo("data:text/html;base64,AAAA")).toBeUndefined();
    expect(sanitizeLogo("file:///etc/passwd")).toBeUndefined();
  });
});

describe("parseUrlParams", () => {
  it("returns defaults for an empty query", () => {
    const r = parseUrlParams("");
    expect(r.config).toEqual(DEFAULT_CONFIG);
    expect(r.hasData).toBe(false);
    expect(r.fromUrl).toBe(false);
  });

  it("reads data and simple params (example 1 & 2 from the plan)", () => {
    expect(parseUrlParams("?data=https%3A%2F%2Fexample.com").config.data).toBe("https://example.com");
    const r = parseUrlParams("?text=Hello%20World&fg=%23ff0000&bg=%23ffffff&size=400");
    expect(r.config).toMatchObject({ data: "Hello World", fg: "#ff0000", bg: "#ffffff", size: 400 });
    expect(r.hasData).toBe(true);
  });

  it("handles Wi-Fi payloads with ; and : unescaped (example 3)", () => {
    const r = parseUrlParams("?data=WIFI:T:WPA;S:MyNetwork;P:password123;;&ec=H&anim=pulse");
    expect(r.config).toMatchObject({ data: "WIFI:T:WPA;S:MyNetwork;P:password123;;", ec: "H", anim: "pulse" });
  });

  it("reads a compressed config (example 4)", () => {
    const c = encodeCompressed({ data: "hi", module: "dots", anim: "wave" });
    const r = parseUrlParams(`?c=${c}`);
    expect(r.config).toMatchObject({ data: "hi", module: "dots", anim: "wave" });
  });

  it("accepts base64url JSON configs", () => {
    const b64 = Buffer.from(JSON.stringify({ data: "héllo", fg: "#00ff00" })).toString("base64url");
    expect(parseUrlParams(`?config=${b64}`).config).toMatchObject({ data: "héllo", fg: "#00ff00" });
  });

  it("lets simple params override the compressed config", () => {
    const c = encodeCompressed({ data: "hi", anim: "wave" });
    expect(parseUrlParams(`?c=${c}&anim=scan`).config.anim).toBe("scan");
  });

  it("clamps numbers and ignores invalid values", () => {
    const r = parseUrlParams("?data=x&size=99999&fps=-3&duration=abc&module=hexagon&ec=Z&margin=2.6");
    expect(r.config).toMatchObject({ size: 2048, fps: 5, duration: DEFAULT_CONFIG.duration, module: "square", ec: "M", margin: 3 });
  });

  it("is case-insensitive for keys and enum values", () => {
    expect(parseUrlParams("?DATA=x&EC=h&Anim=ColorCycle").config).toMatchObject({ ec: "H", anim: "colorCycle" });
  });

  it("blocks dangerous schemes", () => {
    const r = parseUrlParams("?data=javascript:alert(1)");
    expect(r.config.data).toBe("");
    expect(r.hasData).toBe(false);
    expect(r.warnings.length).toBe(1);
  });

  it("truncates huge data", () => {
    const r = parseUrlParams(`?data=${"a".repeat(5000)}`);
    expect(r.config.data.length).toBe(2048);
    expect(r.warnings.length).toBe(1);
  });

  it("strips control characters", () => {
    expect(parseUrlParams("?data=a%00b%07c%0Ad").config.data).toBe("abc\nd");
  });

  it("warns about rejected logos", () => {
    const r = parseUrlParams("?data=x&logo=javascript:alert(1)");
    expect(r.config.logo).toBe("");
    expect(r.warnings).toHaveLength(1);
  });

  it("detects embed mode", () => {
    expect(parseUrlParams("?data=x&embed=1").embed).toBe(true);
    expect(parseUrlParams("?data=x&embed=0").embed).toBe(false);
    expect(parseUrlParams("?data=x").embed).toBe(false);
  });

  it("survives a malformed compressed config", () => {
    const r = parseUrlParams("?c=%%%not-valid&data=ok");
    expect(r.config.data).toBe("ok");
  });
});

describe("share links", () => {
  const configs = [
    { ...DEFAULT_CONFIG, data: "https://example.com" },
    { ...DEFAULT_CONFIG, data: "Hello & goodbye = ?#", fg: "#ff0000", anim: "pulse" as const },
    sanitizeConfig({
      data: "WIFI:T:WPA;S:Net;P:p@ss;;",
      gradient: "radial-ff0000-00ff00",
      module: "dots",
      eye: "leaf",
      eyeColor: "#123456",
      frame: "label",
      frameText: "SCAN ME ✨",
      anim: "particle",
      duration: 3000,
      fps: 24,
      loop: 3,
      format: "gif",
      bg: "transparent",
    }),
  ];

  it.each(["auto", "simple", "compressed"] as const)("round-trips (%s)", (mode) => {
    for (const config of configs) {
      const q = buildShareQuery(config, { mode });
      expect(parseUrlParams(q).config).toEqual(config);
    }
  });

  it("omits defaults", () => {
    expect(buildShareQuery({ ...DEFAULT_CONFIG, data: "x" }, { mode: "simple" })).toBe("data=x");
  });
});
