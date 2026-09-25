"use client";

import { useToasts } from "@/lib/toast";

const ICON = { success: "✓", error: "!", info: "i" } as const;

/** Notifications, announced to screen readers. Sits above the mobile action bar. */
export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          className="toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm shadow-2xl"
        >
          <span
            aria-hidden
            className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white ${
              t.kind === "error" ? "bg-red-600" : t.kind === "info" ? "bg-[var(--color-navy)] dark:bg-accent" : "bg-emerald-600"
            }`}
          >
            {ICON[t.kind]}
          </span>
          <p className="flex-1">{t.message}</p>
          <button type="button" onClick={() => dismiss(t.id)} className="-m-2 grid h-9 w-9 place-items-center text-muted hover:text-fg" aria-label="Dismiss notification">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
