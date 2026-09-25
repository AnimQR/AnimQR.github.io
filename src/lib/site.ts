/**
 * Site-wide SEO settings. Everything that search engines and social networks see is configured here.
 * Values can be overridden at build time with the NEXT_PUBLIC_* environment variables below,
 * so forks and self-hosted copies don't need code changes.
 */

const env = (key: string) => {
  const v = process.env[key];
  return v && v.trim() ? v.trim() : undefined;
};

const trimSlash = (s: string) => s.replace(/\/+$/, "");

/** Public origin + base path, without trailing slash, e.g. "https://animqr.github.io". */
export const SITE_URL = trimSlash(env("NEXT_PUBLIC_SITE_URL") ?? "https://animqr.github.io") + (process.env.NEXT_PUBLIC_BASE_PATH || "");

export const SITE = {
  name: "AnimQR",
  /** Default <title> (the home page). */
  title: "AnimQR — Free Animated QR Code Generator (GIF, MP4, SVG)",
  /** Suffix added to every other page title. */
  titleTemplate: "%s | AnimQR",
  description:
    "Create free animated QR codes online with custom colours, dots, logos and frames. Export GIF, MP4, PNG or SVG. No sign-up, no watermark, open source.",
  shortDescription: "Free & open-source animated QR code generator.",
  keywords: [
    "animated qr code",
    "animated qr code generator",
    "qr code generator",
    "free qr code generator",
    "qr code gif",
    "qr code with logo",
    "custom qr code",
    "styled qr code",
    "qr code video",
    "qr code svg",
    "wifi qr code",
    "vcard qr code",
    "open source qr code generator",
    "no sign up qr code",
  ],
  locale: "en_US",
  language: "en",
  /** Content encoded when someone opens the generator for the first time (the "preloaded URL"). */
  preloadUrl: env("NEXT_PUBLIC_PRELOAD_URL") ?? trimSlash(env("NEXT_PUBLIC_SITE_URL") ?? "https://animqr.github.io"),
  repoUrl: env("NEXT_PUBLIC_REPO_URL") ?? "https://github.com/AnimQR/AnimQR.github.io",
  author: env("NEXT_PUBLIC_AUTHOR") ?? "AnimQR contributors",
  /** Twitter/X handle including "@", optional. */
  twitter: env("NEXT_PUBLIC_TWITTER_HANDLE"),
  themeColor: { light: "#f7f7fb", dark: "#0b0d14" },
  brandColor: "#7c5cff",
  /** Search console verification tokens (the `content` value of the meta tag each tool gives you). */
  verification: {
    google: env("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION"),
    bing: env("NEXT_PUBLIC_BING_SITE_VERIFICATION"),
    yandex: env("NEXT_PUBLIC_YANDEX_VERIFICATION"),
    pinterest: env("NEXT_PUBLIC_PINTEREST_VERIFICATION"),
  },
  /** Set NEXT_PUBLIC_NOINDEX=1 for staging/preview deployments. */
  noindex: env("NEXT_PUBLIC_NOINDEX") === "1",
} as const;

/** Absolute URL for a site path ("/docs/" → "https://animqr.github.io/docs/"). */
export function absoluteUrl(path = "/") {
  return SITE_URL + (path.startsWith("/") ? path : `/${path}`);
}
