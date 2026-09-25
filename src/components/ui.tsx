"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

export function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, children, hint }: { label: string; children: (id: string) => ReactNode; hint?: ReactNode }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 placeholder:text-muted/70";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} min-h-24 resize-y ${props.className ?? ""}`} />;
}

export function Select<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id?: string;
  /** Accessible name when there is no visible <label>. */
  label?: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <select id={id} aria-label={label} value={value} onChange={(e) => onChange(e.target.value as T)} className={inputClass}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: readonly { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`min-h-10 rounded-lg border px-3 py-1.5 text-sm transition ${
              active
                ? "border-accent bg-accent/15 text-fg"
                : "border-line bg-surface-2 text-muted hover:border-muted hover:text-fg"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function ColorInput({
  label,
  value,
  onChange,
  allowTransparent,
  allowAuto,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  allowTransparent?: boolean;
  allowAuto?: boolean;
}) {
  const id = useId();
  const isTransparent = value === "transparent";
  const isAuto = value === "";
  const swatch = isTransparent || isAuto ? "#ffffff" : value.slice(0, 7);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={swatch}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-surface-2 p-1"
        />
        <input
          id={id}
          value={draft}
          placeholder={allowAuto ? "auto" : "#000000"}
          onBlur={() => setDraft(value)}
          onChange={(e) => {
            setDraft(e.target.value);
            const v = e.target.value.trim();
            if (allowAuto && v === "") onChange("");
            else if (/^#?[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v) || v === "transparent") onChange(v);
          }}
          className={`${inputClass} font-mono`}
          spellCheck={false}
        />
        {allowTransparent && (
          <button
            type="button"
            onClick={() => onChange(isTransparent ? "#ffffff" : "transparent")}
            className={`h-10 shrink-0 rounded-lg border px-2 text-xs ${isTransparent ? "border-accent text-fg" : "border-line text-muted"}`}
            title="Transparent background"
          >
            None
          </button>
        )}
        {allowAuto && !isAuto && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="h-10 shrink-0 rounded-lg border border-line px-2 text-xs text-muted"
            title="Use the foreground colour"
          >
            Auto
          </button>
        )}
      </div>
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v) => String(v),
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        <span className="font-mono text-xs text-muted">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-accent)]"
      />
    </div>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <span
        role="switch"
        aria-checked={checked}
        aria-label={label}
        tabIndex={0}
        onKeyDown={(e) => (e.key === " " || e.key === "Enter") && (e.preventDefault(), onChange(!checked))}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-10 rounded-full transition ${checked ? "bg-accent" : "bg-line"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-[18px]" : "left-0.5"}`} />
      </span>
      {label}
    </label>
  );
}

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const styles = {
    primary: "bg-accent text-white hover:bg-accent/90 disabled:opacity-50",
    secondary: "border border-line bg-surface-2 hover:border-muted disabled:opacity-50",
    ghost: "text-muted hover:text-fg",
  }[variant];
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${styles} ${className}`}
    />
  );
}
