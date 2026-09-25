import { describe, expect, it } from "vitest";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import manifest from "../app/manifest";
import { initialState, HOME_DEFAULTS } from "@/lib/defaults";
import { LANDING_PAGES } from "@/lib/landing";
import { pageMetadata } from "@/lib/metadata";
import { initialPreview } from "@/lib/preview";
import { faqSchema } from "@/lib/schema";
import { SITE } from "@/lib/site";

describe("landing pages", () => {
  it("have unique slugs, titles and descriptions", () => {
    for (const key of ["slug", "title", "description", "h1"] as const) {
      const values = LANDING_PAGES.map((p) => p[key]);
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it.each(LANDING_PAGES.map((p) => [p.slug, p]))("%s has search-friendly title and description lengths", (_, p) => {
    expect(`${p.title} | ${SITE.name}`.length).toBeLessThanOrEqual(75);
    expect(p.description.length).toBeGreaterThanOrEqual(70);
    expect(p.description.length).toBeLessThanOrEqual(170);
    expect(p.slug).toMatch(/^[a-z0-9-]+$/);
  });

  it.each(LANDING_PAGES.map((p) => [p.slug, p]))("%s preloads a code that renders", (_, p) => {
    const { config } = initialState(p.defaults);
    expect(config.data.length).toBeGreaterThan(0);
    expect(initialPreview(p.defaults).svg.startsWith("<svg")).toBe(true);
  });
});

describe("home page", () => {
  it("preloads the site URL on first visit", () => {
    expect(initialState(HOME_DEFAULTS).config.data).toBe(SITE.preloadUrl);
    expect(SITE.title.length).toBeLessThanOrEqual(65);
    expect(SITE.description.length).toBeLessThanOrEqual(170);
  });
});

describe("metadata", () => {
  it("sets canonical and social images", () => {
    const m = pageMetadata({ title: "X", description: "Y", path: "/docs/" });
    expect(m.alternates?.canonical).toBe("https://animqr.github.io/docs/");
    expect(JSON.stringify(m.openGraph)).toContain("opengraph-image.png");
    expect(JSON.stringify(m.twitter)).toContain("twitter-image.png");
  });
});

describe("robots, sitemap, manifest", () => {
  it("lists every indexable page in the sitemap", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://animqr.github.io/");
    expect(urls).toContain("https://animqr.github.io/docs/");
    for (const p of LANDING_PAGES) expect(urls).toContain(`https://animqr.github.io/${p.slug}/`);
    expect(urls.every((u) => u.endsWith("/"))).toBe(true);
  });

  it("points robots at the sitemap and hides the query-driven alias", () => {
    const r = robots();
    expect(r.sitemap).toBe("https://animqr.github.io/sitemap.xml");
    expect(JSON.stringify(r.rules)).toContain("/generate/");
  });

  it("declares installable icons", () => {
    const m = manifest();
    expect(m.icons?.some((i) => i.purpose === "maskable")).toBe(true);
    expect(m.icons?.some((i) => i.sizes === "512x512")).toBe(true);
  });
});

it("FAQ schema is well-formed", () => {
  const s = faqSchema([{ q: "a?", a: "b" }]);
  expect(s.mainEntity[0]).toEqual({ "@type": "Question", name: "a?", acceptedAnswer: { "@type": "Answer", text: "b" } });
});
