import type { Metadata } from "next";
import { absoluteUrl, SITE } from "./site";

/** Per-page metadata: unique title/description, canonical URL and social cards. */
export function pageMetadata({
  title,
  description,
  path,
  keywords = [],
  absoluteTitle = false,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  /** Use the title as-is instead of appending the site name. */
  absoluteTitle?: boolean;
  noindex?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = absoluteTitle ? title : SITE.titleTemplate.replace("%s", title);
  // Page-level openGraph/twitter objects replace the inherited ones, so the images are set explicitly.
  const image = { url: absoluteUrl("/opengraph-image.png"), width: 1200, height: 630, alt: `${SITE.name} — free animated QR code generator`, type: "image/png" };
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords: [...keywords, ...SITE.keywords.filter((k) => !keywords.includes(k))],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: SITE.name,
      title: fullTitle,
      description,
      locale: SITE.locale,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [{ url: absoluteUrl("/twitter-image.png"), alt: image.alt }],
      ...(SITE.twitter ? { site: SITE.twitter, creator: SITE.twitter } : {}),
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
