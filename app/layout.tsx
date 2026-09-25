import type { Metadata, Viewport } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, websiteSchema } from "@/lib/schema";
import { SITE, SITE_URL } from "@/lib/site";
import "./globals.css";

const verificationOther: Record<string, string> = {};
if (SITE.verification.bing) verificationOther["msvalidate.01"] = SITE.verification.bing;
if (SITE.verification.pinterest) verificationOther["p:domain_verify"] = SITE.verification.pinterest;

export const metadata: Metadata = {
  // Origin only: Next.js adds the base path to file-based icons and images itself.
  metadataBase: new URL(new URL(SITE_URL).origin),
  title: { default: SITE.title, template: SITE.titleTemplate },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [...SITE.keywords],
  authors: [{ name: SITE.author, url: SITE.repoUrl }],
  creator: SITE.author,
  publisher: SITE.name,
  category: "technology",
  formatDetection: { telephone: false, email: false, address: false },
  robots: SITE.noindex
    ? { index: false, follow: false }
    : {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
      },
  verification: {
    ...(SITE.verification.google ? { google: SITE.verification.google } : {}),
    ...(SITE.verification.yandex ? { yandex: SITE.verification.yandex } : {}),
    ...(Object.keys(verificationOther).length ? { other: verificationOther } : {}),
  },
  appleWebApp: { capable: true, title: SITE.name, statusBarStyle: "black-translucent" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    title: SITE.title,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
    ...(SITE.twitter ? { site: SITE.twitter, creator: SITE.twitter } : {}),
  },
  other: { "msapplication-TileColor": SITE.brandColor },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: SITE.themeColor.light },
    { media: "(prefers-color-scheme: dark)", color: SITE.themeColor.dark },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={SITE.language}>
      <body className="min-h-screen font-sans antialiased">
        <JsonLd data={[websiteSchema(), organizationSchema()]} />
        {children}
        <noscript>
          <p className="mx-auto max-w-6xl px-4 pb-8 text-sm text-muted">
            AnimQR needs JavaScript to generate and animate QR codes in your browser.
          </p>
        </noscript>
      </body>
    </html>
  );
}
