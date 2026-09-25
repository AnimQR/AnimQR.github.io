"use client";

import { ANIMATIONS, LIMITS, SAFE_ANIMATIONS, type AnimationPreset } from "@/lib/config";
import { frameCount } from "@/lib/export";
import { useStore } from "@/lib/store";
import { Section, Segmented, Slider } from "./ui";

const ANIM_INFO: Record<AnimationPreset, { label: string; desc: string }> = {
  none: { label: "None", desc: "Static code." },
  pulse: { label: "Pulse", desc: "Modules breathe in a ripple from the centre." },
  wave: { label: "Wave", desc: "A gentle wave travels across the code." },
  fade: { label: "Shimmer", desc: "A diagonal band of light sweeps across." },
  rotate: { label: "Rotate", desc: "Modules spin in place (best with square, diamond or star)." },
  colorCycle: { label: "Colour cycle", desc: "Hues rotate while brightness — and contrast — stay constant." },
  scan: { label: "Scan line", desc: "A scanner beam sweeps up and down." },
  reveal: { label: "Reveal", desc: "Modules pop in one by one, hold, then fade out." },
  particle: { label: "Particles", desc: "Modules fly in from all directions and assemble." },
};

export function AnimationPanel() {
  const { config, update } = useStore();
  const safe = SAFE_ANIMATIONS.has(config.anim);
  const frames = frameCount(config);

  return (
    <div className="space-y-6">
      <Section title="Animation">
        <Segmented
          label="Animation preset"
          value={config.anim}
          onChange={(anim) => update({ anim })}
          options={ANIMATIONS.map((a) => ({
            value: a,
            label: (
              <>
                {ANIM_INFO[a].label}
                {!SAFE_ANIMATIONS.has(a) && <span className="ml-1 text-amber-700 dark:text-amber-300" aria-label="not always scannable">◐</span>}
              </>
            ),
            title: ANIM_INFO[a].desc,
          }))}
        />
        <p className="text-sm text-muted">{ANIM_INFO[config.anim].desc}</p>
        {!safe && (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            ◐ This preset is only scannable during its “hold” phase. Pick a safe preset if the code must scan on every frame.
          </p>
        )}
      </Section>

      {config.anim !== "none" && (
        <Section title="Timing">
          <Slider
            label="Duration (one loop)"
            value={config.duration}
            min={LIMITS.duration[0]}
            max={LIMITS.duration[1]}
            step={100}
            format={(v) => `${(v / 1000).toFixed(1)}s`}
            onChange={(duration) => update({ duration })}
          />
          <Slider label="Frames per second" value={config.fps} min={LIMITS.fps[0]} max={LIMITS.fps[1]} onChange={(fps) => update({ fps })} />
          <Slider
            label="GIF loop count"
            value={config.loop}
            min={LIMITS.loop[0]}
            max={20}
            format={(v) => (v === 0 ? "forever" : `${v}×`)}
            onChange={(loop) => update({ loop })}
          />
          <p className="text-xs text-muted">
            GIF export: {frames} frames{config.fps > 30 && " — GIF players often cap at ~50 fps; 15–30 fps is a good balance"}.
          </p>
        </Section>
      )}
    </div>
  );
}
