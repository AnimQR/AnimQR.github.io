import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: `${base}/`,
    name: "AnimQR — Animated QR Code Generator",
    short_name: SITE.name,
    description: SITE.shortDescription,
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone",
    background_color: SITE.themeColor.dark,
    theme_color: SITE.themeColor.dark,
    categories: ["design", "productivity", "utilities"],
    lang: SITE.language,
    icons: [
      { src: `${base}/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${base}/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${base}/maskable-icon-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
