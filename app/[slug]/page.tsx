import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Generator } from "@/components/Generator";
import { Shell } from "@/components/Shell";
import { JsonLd } from "@/components/seo/JsonLd";
import { Hero, SeoContent } from "@/components/seo/SeoContent";
import { getLandingPage, HOME_FAQ, LANDING_PAGES } from "@/lib/landing";
import { pageMetadata } from "@/lib/metadata";
import { initialPreview } from "@/lib/preview";
import { breadcrumbSchema, faqSchema, howToSchema, webAppSchema } from "@/lib/schema";

export const dynamicParams = false;

export function generateStaticParams() {
  return LANDING_PAGES.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getLandingPage((await params).slug);
  if (!page) return {};
  return pageMetadata({ title: page.title, description: page.description, path: `/${page.slug}/`, keywords: page.keywords });
}

export default async function LandingPage({ params }: Props) {
  const page = getLandingPage((await params).slug);
  if (!page) notFound();
  const preview = initialPreview(page.defaults);
  const faq = [...page.faq, ...HOME_FAQ.slice(0, 4)];
  const path = `/${page.slug}/`;
  return (
    <Shell>
      <JsonLd
        data={[
          webAppSchema(path, page.h1, page.description),
          howToSchema(page.howTo, page.steps),
          faqSchema(faq),
          breadcrumbSchema([
            { name: "QR code generator", path: "/" },
            { name: page.nav, path },
          ]),
        ]}
      />
      <Hero
        h1={page.h1}
        intro={page.intro}
        crumbs={[
          { name: "Home", href: "/" },
          { name: page.nav, href: path },
        ]}
      />
      <Generator defaults={page.defaults} restoreSaved={false} initialSvg={preview.svg} initialAlt={preview.alt} />
      <SeoContent howToTitle={page.howTo} steps={page.steps} faq={faq} currentSlug={page.slug} />
    </Shell>
  );
}
