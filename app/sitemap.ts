import type { MetadataRoute } from "next";
import { LANDING_PAGES } from "@/lib/landing";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

/** Updated at build time; each deploy refreshes lastModified. */
const lastModified = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "weekly", priority: 1, images: [absoluteUrl("/opengraph-image.png")] },
    ...LANDING_PAGES.map((p) => ({
      url: absoluteUrl(`/${p.slug}/`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: absoluteUrl("/docs/"), lastModified, changeFrequency: "monthly", priority: 0.5 },
  ];
}
