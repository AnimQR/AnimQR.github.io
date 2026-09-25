import Link from "next/link";
import { LANDING_PAGES, type Faq } from "@/lib/landing";

/** Server-rendered, crawlable content shown below the generator. */
export function SeoContent({
  howToTitle,
  steps,
  faq,
  currentSlug,
  showFeatures = true,
}: {
  howToTitle: string;
  steps: string[];
  faq: Faq[];
  currentSlug?: string;
  showFeatures?: boolean;
}) {
  const related = LANDING_PAGES.filter((p) => p.slug !== currentSlug);
  return (
    <div className="embed-hide mx-auto max-w-6xl space-y-14 px-4 pb-16">
      <section aria-labelledby="how-to" className="space-y-4">
        <h2 id="how-to" className="text-2xl font-semibold tracking-tight">
          {howToTitle}
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s} className="rounded-xl border border-line bg-surface p-4 text-sm">
              <span className="mb-2 grid h-7 w-7 place-items-center rounded-full bg-accent text-xs font-semibold text-white">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </section>

      {showFeatures && (
        <section aria-labelledby="features" className="space-y-4">
          <h2 id="features" className="text-2xl font-semibold tracking-tight">
            Why AnimQR?
          </h2>
          <ul className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Animated & scannable", "Eight motion presets. The corner eyes and alignment patterns stay solid, so safe presets scan on every frame."],
              ["Every format", "GIF, MP4 and WebM for motion; PNG, JPEG and SVG for print. Up to 2048px."],
              ["Fully customisable", "Colours, gradients, dots, diamonds, stars, bars, rounded eyes, logos and labelled frames."],
              ["Private by design", "Runs 100% in your browser. Nothing you type or upload is sent anywhere."],
              ["Free forever", "No account, no watermark, no scan limits and codes that never expire. MIT licensed."],
              ["Linkable", "Create any code straight from a URL — perfect for docs, scripts and automations."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-xl border border-line bg-surface p-4">
                <h3 className="font-semibold">{t}</h3>
                <p className="mt-1 text-muted">{d}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="faq" className="space-y-4">
        <h2 id="faq" className="text-2xl font-semibold tracking-tight">
          Frequently asked questions
        </h2>
        <div className="divide-y divide-line rounded-xl border border-line bg-surface">
          {faq.map((f) => (
            <details key={f.q} className="group p-4">
              <summary className="cursor-pointer list-none font-medium marker:hidden">
                <span className="mr-2 inline-block text-accent-ink transition group-open:rotate-90">›</span>
                {f.q}
              </summary>
              <p className="mt-2 pl-5 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <nav aria-labelledby="more-tools" className="space-y-4">
        <h2 id="more-tools" className="text-2xl font-semibold tracking-tight">
          More QR code tools
        </h2>
        <ul className="flex flex-wrap gap-2">
          {currentSlug && (
            <li>
              <Link href="/" className="inline-block rounded-full border border-line bg-surface px-4 py-2 text-sm hover:border-accent">
                QR code generator
              </Link>
            </li>
          )}
          {related.map((p) => (
            <li key={p.slug}>
              <Link href={`/${p.slug}/`} className="inline-block rounded-full border border-line bg-surface px-4 py-2 text-sm hover:border-accent">
                {p.nav}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/docs/" className="inline-block rounded-full border border-line bg-surface px-4 py-2 text-sm hover:border-accent">
              URL API
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export function Hero({ h1, intro, crumbs }: { h1: string; intro: string; crumbs?: { name: string; href: string }[] }) {
  return (
    <div className="embed-hide mx-auto max-w-6xl px-4 pb-6 pt-2">
      {crumbs && (
        <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            {crumbs.map((c, i) => (
              <li key={c.href} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden>/</span>}
                {i < crumbs.length - 1 ? (
                  <Link href={c.href} className="hover:text-fg">
                    {c.name}
                  </Link>
                ) : (
                  <span aria-current="page">{c.name}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{h1}</h1>
      <p className="mt-2 max-w-3xl text-muted">{intro}</p>
    </div>
  );
}
