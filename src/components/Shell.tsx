import Link from "next/link";
import type { ReactNode } from "react";

export const REPO_URL = "https://github.com/AnimQR/AnimQR.github.io";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span aria-hidden className="grid h-9 w-9 grid-cols-3 gap-0.5 rounded-lg bg-accent p-1.5">
            {[1, 1, 1, 1, 0, 1, 1, 1, 0].map((on, i) => (
              <span key={i} className={`rounded-[2px] ${on ? "bg-white" : "bg-white/30"}`} />
            ))}
          </span>
          <span className="text-lg font-semibold tracking-tight">AnimQR</span>
          <span className="hidden rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted sm:inline">
            free · open source
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted">
          <Link href="/docs/" className="hover:text-fg">
            URL API
          </Link>
          <a href={REPO_URL} className="hover:text-fg" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </header>
      {children}
      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-muted">
        MIT licensed · Everything runs in your browser — nothing you enter is uploaded. ·{" "}
        <a className="underline hover:text-fg" href={REPO_URL} target="_blank" rel="noreferrer">
          Source
        </a>
        <br />
        QR Code is a registered trademark of DENSO WAVE INCORPORATED.
      </footer>
    </>
  );
}
