import Link from "next/link";
import type { ReactNode } from "react";
import { LANDING_PAGES } from "@/lib/landing";
import { SITE } from "@/lib/site";

export const REPO_URL = SITE.repoUrl;

export function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="embed-hide sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <div aria-hidden className="embed-hide h-1 bg-[linear-gradient(90deg,var(--color-maroon),var(--color-accent)_45%,var(--color-navy))]" />
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5">
        <Link href="/" className="flex items-center gap-2.5" aria-label="AnimQR home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/icon.svg`} alt="" width={36} height={36} className="h-9 w-9" />
          <span className="text-lg font-semibold tracking-tight">AnimQR</span>
          <span className="hidden rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted sm:inline">
            free · open source
          </span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-4 text-sm text-muted">
          <Link href="/animated-qr-code-generator/" className="hidden hover:text-fg md:inline">
            Animated QR
          </Link>
          <Link href="/docs/" className="hover:text-fg">
            URL API
          </Link>
          <a href={REPO_URL} className="hover:text-fg" target="_blank" rel="noopener">
            GitHub
          </a>
        </nav>
      </header>
      <main id="main">{children}</main>
      <footer className="mx-auto max-w-6xl space-y-4 border-t border-line px-4 py-10 text-xs text-muted">
        <nav aria-label="QR code tools">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            <li>
              <Link href="/" className="hover:text-fg">
                QR code generator
              </Link>
            </li>
            {LANDING_PAGES.map((p) => (
              <li key={p.slug}>
                <Link href={`/${p.slug}/`} className="hover:text-fg">
                  {p.nav}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/docs/" className="hover:text-fg">
                URL API
              </Link>
            </li>
          </ul>
        </nav>
        <p>
          MIT licensed · Everything runs in your browser — nothing you enter is uploaded. ·{" "}
          <a className="underline hover:text-fg" href={REPO_URL} target="_blank" rel="noopener">
            Source on GitHub
          </a>
          <br />
          QR Code is a registered trademark of DENSO WAVE INCORPORATED.
        </p>
      </footer>
    </>
  );
}
