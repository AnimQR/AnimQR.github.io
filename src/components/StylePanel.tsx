"use client";

import { useEffect, useRef, useState } from "react";
import {
  EC_LEVELS,
  EYE_SHAPES,
  FRAMES,
  LIMITS,
  MAX_LOGO_FOR_EC,
  MODULE_SHAPES,
  sanitizeConfig,
  type EyeShape,
  type FrameStyle,
  type ModuleShape,
  type QRConfig,
} from "@/lib/config";
import { fileToLogoDataUrl } from "@/lib/logo";
import { BUILTIN_PRESETS, extractStyle, loadUserPresets, saveUserPresets, type StylePreset } from "@/lib/presets";
import { contrastRatio, relativeLuminance } from "@/lib/qr/color";
import { useStore } from "@/lib/store";
import { Button, ColorInput, Field, Section, Segmented, Slider, TextInput, Toggle } from "./ui";

const MODULE_LABELS: Record<ModuleShape, string> = {
  square: "■ Square",
  rounded: "▢ Rounded",
  dots: "● Dots",
  diamond: "◆ Diamond",
  star: "★ Star",
  vbars: "┃ V-bars",
  hbars: "━ H-bars",
};
const EYE_LABELS: Record<EyeShape, string> = { square: "Square", rounded: "Rounded", circle: "Circle", leaf: "Leaf" };
const FRAME_LABELS: Record<FrameStyle, string> = { none: "None", square: "Square", rounded: "Rounded", label: "With label" };
const EC_LABELS = { L: "L · 7%", M: "M · 15%", Q: "Q · 25%", H: "H · 30%" } as const;

/** Small colour dot previewing a preset's foreground on its background. */
function PresetSwatch({ style }: { style: Partial<QRConfig> }) {
  const g = style.gradient;
  const fg = g ? `linear-gradient(135deg, ${g.stops[0]}, ${g.stops[1]})` : (style.fg ?? "#0a1f44");
  const bg = style.bg && style.bg !== "transparent" ? style.bg : "#ffffff";
  return (
    <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line sm:h-6 sm:w-6" style={{ background: bg }}>
      <span className="h-3.5 w-3.5 rounded-[4px]" style={{ background: fg }} />
    </span>
  );
}

function Presets() {
  const { config, applyStyle } = useStore();
  const [user, setUser] = useState<StylePreset[]>([]);
  useEffect(() => setUser(loadUserPresets()), []);

  const save = () => {
    const name = window.prompt("Name this style", `My style ${user.length + 1}`)?.trim();
    if (!name) return;
    const next = [...user.filter((p) => p.name !== name), { name: name.slice(0, 40), style: extractStyle(config) }];
    setUser(next);
    saveUserPresets(next);
  };
  const remove = (name: string) => {
    const next = user.filter((p) => p.name !== name);
    setUser(next);
    saveUserPresets(next);
  };
  // Saved presets come from storage, so they are re-validated before use.
  const apply = (p: StylePreset) => applyStyle(sanitizeConfig(p.style as Record<string, unknown>, config));

  const isActive = (p: StylePreset) =>
    Object.entries(p.style).every(([k, v]) => JSON.stringify(config[k as keyof QRConfig]) === JSON.stringify(v));

  const chip = (active: boolean) =>
    `inline-flex min-h-11 items-center gap-2 rounded-full border pl-1.5 pr-3.5 text-sm transition active:scale-[0.97] sm:min-h-10 ${
      active ? "border-accent bg-accent/15 font-medium" : "border-line bg-surface-2 hover:border-accent"
    }`;

  return (
    <Section
      title="Presets"
      aside={
        <Button variant="ghost" className="min-h-9 px-1 py-0 text-xs sm:min-h-9" onClick={save}>
          + Save current
        </Button>
      }
    >
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [mask-image:linear-gradient(to_right,black_85%,transparent)] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:[mask-image:none]">
        {BUILTIN_PRESETS.map((p) => (
          <button key={p.name} type="button" onClick={() => apply(p)} aria-pressed={isActive(p)} className={`${chip(isActive(p))} shrink-0`}>
            <PresetSwatch style={p.style} />
            {p.name}
          </button>
        ))}
        {user.map((p) => (
          <span key={p.name} className={`${chip(isActive(p))} shrink-0 pr-0`}>
            <button type="button" onClick={() => apply(p)} className="inline-flex min-h-10 items-center gap-2" aria-pressed={isActive(p)}>
              <PresetSwatch style={p.style} />
              {p.name}
            </button>
            <button type="button" onClick={() => remove(p.name)} className="grid h-10 w-10 place-items-center text-muted hover:text-fg" aria-label={`Delete ${p.name}`}>
              ×
            </button>
          </span>
        ))}
      </div>
    </Section>
  );
}

function LogoControls() {
  const { config, update } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [urlDraft, setUrlDraft] = useState(config.logo.startsWith("data:") ? "" : config.logo);
  useEffect(() => {
    if (!config.logo.startsWith("data:")) setUrlDraft(config.logo);
  }, [config.logo]);
  const maxLogo = MAX_LOGO_FOR_EC[config.ec];

  return (
    <Section title="Logo">
      <div className="flex gap-2">
        <TextInput
          aria-label="Logo image URL"
          placeholder="https://… (must allow CORS)"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onBlur={() => update({ logo: urlDraft.trim() })}
          onKeyDown={(e) => e.key === "Enter" && update({ logo: urlDraft.trim() })}
        />
        <Button onClick={() => fileRef.current?.click()}>Upload</Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              setError("");
              const logo = await fileToLogoDataUrl(file);
              update({ logo, ...(config.ec === "L" || config.ec === "M" ? { ec: "H" } : {}) });
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        />
      </div>
      {error && <p className="text-xs text-red-700 dark:text-red-300">{error}</p>}
      {config.logo && (
        <>
          <Slider
            label="Logo size"
            value={Math.min(config.logoSize, maxLogo)}
            min={LIMITS.logoSize[0]}
            max={maxLogo}
            step={0.01}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(logoSize) => update({ logoSize })}
          />
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Modules behind the logo are cleared. Max size depends on error correction ({config.ec}).</span>
            <Button variant="ghost" className="min-h-0 px-0 py-0 text-xs" onClick={() => update({ logo: "" })}>
              Remove
            </Button>
          </div>
        </>
      )}
    </Section>
  );
}

export function StylePanel() {
  const { config, update } = useStore();
  const gradient = config.gradient;

  const effectiveFg = gradient ? gradient.stops[0] : config.fg;
  const lowContrast =
    config.bg !== "transparent" &&
    (contrastRatio(effectiveFg, config.bg) < 3 || (gradient && contrastRatio(gradient.stops[1], config.bg) < 3));
  const inverted = config.bg !== "transparent" && relativeLuminance(effectiveFg) > relativeLuminance(config.bg);

  return (
    <div className="space-y-6">
      <Presets />

      <Section title="Colours">
        <div className="grid gap-3 sm:grid-cols-2">
          {!gradient && <ColorInput label="Foreground" value={config.fg} onChange={(fg) => update({ fg })} />}
          <ColorInput label="Background" value={config.bg} allowTransparent onChange={(bg) => update({ bg })} />
        </div>
        <Toggle
          label="Gradient foreground"
          checked={!!gradient}
          onChange={(on) => update({ gradient: on ? { type: "linear", angle: 45, stops: ["#800020", config.fg === "#800020" ? "#0a1f44" : config.fg] } : null })}
        />
        {gradient && (
          <div className="space-y-3 rounded-lg border border-line p-3">
            <Segmented
              label="Gradient type"
              value={gradient.type}
              onChange={(type) => update({ gradient: { ...gradient, type } })}
              options={[
                { value: "linear", label: "Linear" },
                { value: "radial", label: "Radial" },
              ]}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <ColorInput label="From" value={gradient.stops[0]} onChange={(c) => update({ gradient: { ...gradient, stops: [c, gradient.stops[1]] } })} />
              <ColorInput label="To" value={gradient.stops[1]} onChange={(c) => update({ gradient: { ...gradient, stops: [gradient.stops[0], c] } })} />
            </div>
            {gradient.type === "linear" && (
              <Slider label="Angle" value={gradient.angle} min={0} max={359} format={(v) => `${v}°`} onChange={(angle) => update({ gradient: { ...gradient, angle } })} />
            )}
          </div>
        )}
        {lowContrast && <p className="text-xs text-amber-700 dark:text-amber-300">⚠ Low contrast between code and background — it may not scan reliably.</p>}
        {!lowContrast && inverted && (
          <p className="text-xs text-amber-700 dark:text-amber-300">⚠ Light-on-dark (inverted) codes are not supported by every scanner.</p>
        )}
      </Section>

      <Section title="Modules">
        <Segmented
          label="Module shape"
          value={config.module}
          onChange={(module) => update({ module })}
          options={MODULE_SHAPES.map((s) => ({ value: s, label: MODULE_LABELS[s] }))}
        />
      </Section>

      <Section title="Corner eyes">
        <Segmented label="Eye shape" value={config.eye} onChange={(eye) => update({ eye })} options={EYE_SHAPES.map((s) => ({ value: s, label: EYE_LABELS[s] }))} />
        <ColorInput label="Eye colour" value={config.eyeColor} allowAuto onChange={(eyeColor) => update({ eyeColor })} />
      </Section>

      <LogoControls />

      <Section title="Frame">
        <Segmented label="Frame" value={config.frame} onChange={(frame) => update({ frame })} options={FRAMES.map((f) => ({ value: f, label: FRAME_LABELS[f] }))} />
        {config.frame !== "none" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <ColorInput label="Frame colour" value={config.frameColor} onChange={(frameColor) => update({ frameColor })} />
            {config.frame === "label" && (
              <Field label="Label">
                {(id) => (
                  <TextInput id={id} maxLength={LIMITS.frameTextMax} value={config.frameText} onChange={(e) => update({ frameText: e.target.value })} />
                )}
              </Field>
            )}
          </div>
        )}
      </Section>

      <Section title="Quality">
        <Field label="Error correction" hint="Higher levels survive logos, damage and heavier styling but make the code denser.">
          {() => (
            <Segmented label="Error correction" value={config.ec} onChange={(ec) => update({ ec })} options={EC_LEVELS.map((l) => ({ value: l, label: EC_LABELS[l] }))} />
          )}
        </Field>
        <Slider label="Quiet zone" value={config.margin} min={LIMITS.margin[0]} max={LIMITS.margin[1]} format={(v) => `${v} modules`} onChange={(margin) => update({ margin })} />
        <Slider label="Export size" value={config.size} min={LIMITS.size[0]} max={LIMITS.size[1]} step={16} format={(v) => `${v}px`} onChange={(size) => update({ size })} />
        {config.margin < 2 && <p className="text-xs text-amber-700 dark:text-amber-300">⚠ A quiet zone below 2 modules can hurt scanning.</p>}
      </Section>
    </div>
  );
}
