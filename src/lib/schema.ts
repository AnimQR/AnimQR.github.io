import type { Faq } from "./landing";
import { absoluteUrl, SITE, SITE_URL } from "./site";

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE.name,
    url: absoluteUrl("/"),
    description: SITE.description,
    inLanguage: SITE.language,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icon-512.png"),
    sameAs: [SITE.repoUrl],
  };
}

export function webAppSchema(path: string, name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    url: absoluteUrl(path),
    description,
    applicationCategory: "DesignApplication",
    operatingSystem: "Any (web browser)",
    browserRequirements: "Requires JavaScript and a modern browser",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    image: absoluteUrl("/opengraph-image.png"),
    screenshot: absoluteUrl("/opengraph-image.png"),
    license: "https://opensource.org/licenses/MIT",
    featureList: [
      "Animated QR codes (pulse, wave, scan line, colour cycle, particles and more)",
      "Export GIF, MP4, WebM, PNG, JPEG and SVG",
      "Custom colours, gradients, module shapes and corner eyes",
      "Logo upload with automatic safe area",
      "Frames with call-to-action labels",
      "URL, text, Wi-Fi, vCard, email, phone and SMS content",
      "Create codes from a link with URL parameters",
      "Runs entirely in the browser — no uploads",
    ],
    author: { "@type": "Organization", name: SITE.author },
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: SITE.language,
  };
}

export function faqSchema(faq: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function howToSchema(name: string, steps: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    totalTime: "PT1M",
    estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "0" },
    step: steps.map((text, i) => ({ "@type": "HowToStep", position: i + 1, name: text, text })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}
