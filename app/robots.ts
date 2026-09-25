import type { MetadataRoute } from "next";
import { absoluteUrl, SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  if (SITE.noindex) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/generate/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
