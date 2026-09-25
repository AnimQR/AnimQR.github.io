import type { Metadata } from "next";
import { Generator } from "@/components/Generator";
import { Shell } from "@/components/Shell";
import { JsonLd } from "@/components/seo/JsonLd";
import { Hero, SeoContent } from "@/components/seo/SeoContent";
import { HOME_DEFAULTS } from "@/lib/defaults";
import { HOME_FAQ } from "@/lib/landing";
import { pageMetadata } from "@/lib/metadata";
import { initialPreview } from "@/lib/preview";
import { faqSchema, howToSchema, webAppSchema } from "@/lib/schema";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: SITE.title,
  description: SITE.description,
  path: "/",
  absoluteTitle: true,
});

const STEPS = [
  "Enter a URL, text, Wi-Fi network, contact card, email, phone number or SMS.",
  "Style it: colours, gradients, dots, corner eyes, a logo and a frame — or pick a preset.",
  "Add an animation such as pulse, wave, scan line or colour cycle.",
  "Download a GIF, MP4, WebM, PNG, JPEG or SVG — or copy a shareable link.",
];

export default function Home() {
  const preview = initialPreview(HOME_DEFAULTS);
  return (
    <Shell>
      <JsonLd
        data={[
          webAppSchema("/", "AnimQR — Animated QR Code Generator", SITE.description),
          howToSchema("How to create an animated QR code", STEPS),
          faqSchema(HOME_FAQ),
        ]}
      />
      <Hero
        h1="Free animated QR code generator"
        intro="Create styled, animated QR codes and download them as GIF, MP4, PNG or SVG. No sign-up, no watermark — everything runs privately in your browser."
      />
      <Generator initialSvg={preview.svg} initialAlt={preview.alt} />
      <SeoContent howToTitle="How to create an animated QR code" steps={STEPS} faq={HOME_FAQ} />
    </Shell>
  );
}
