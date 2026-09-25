import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/metadata";
import { breadcrumbSchema } from "@/lib/schema";
import { ANIMATIONS, EYE_SHAPES, FORMATS, FRAMES, LIMITS, MODULE_SHAPES } from "@/lib/config";

export const metadata: Metadata = pageMetadata({
  title: "QR Code URL API — Generate QR Codes from a Link",
  description:
    "Generate styled, animated QR codes straight from a URL. Reference for every parameter: data, colours, gradients, shapes, logo, frame, animation and export format.",
  path: "/docs/",
  keywords: ["qr code api", "qr code url parameters", "generate qr code from url"],
});

const list = (xs: readonly string[]) => xs.map((x) => `\`${x}\``).join(" · ");

const PARAMS: [string, string, string][] = [
  ["data / text", "Content to encode (required to generate). URL-encode it.", "https%3A%2F%2Fexample.com"],
  ["ec", "Error correction: L · M · Q · H", "H"],
  ["size", `Export size in px (${LIMITS.size[0]}–${LIMITS.size[1]})`, "512"],
  ["margin", `Quiet zone in modules (${LIMITS.margin[0]}–${LIMITS.margin[1]})`, "4"],
  ["fg / bg", "Foreground / background colour (hex, # optional). bg also accepts transparent", "%23ff5500"],
  ["gradient", "linear-<angle>-<from>-<to> or radial-<from>-<to>", "linear-45-ff0-f0f"],
  ["module", list(MODULE_SHAPES), "dots"],
  ["eye", list(EYE_SHAPES), "rounded"],
  ["eyeColor", "Colour of the three corner eyes", "4f46e5"],
  ["logo", "http(s) image URL — the server must send CORS headers", "https://…/logo.png"],
  ["logoSize", `Logo width as a fraction of the code (${LIMITS.logoSize[0]}–${LIMITS.logoSize[1]})`, "0.22"],
  ["frame", list(FRAMES), "label"],
  ["frameText / frameColor", `Label text (max ${LIMITS.frameTextMax} chars) and frame colour`, "SCAN%20ME"],
  ["anim", list(ANIMATIONS), "pulse"],
  ["duration", `Loop duration in ms (${LIMITS.duration[0]}–${LIMITS.duration[1]})`, "2000"],
  ["fps", `Frames per second (${LIMITS.fps[0]}–${LIMITS.fps[1]})`, "15"],
  ["loop", "GIF loop count, 0 = forever", "0"],
  ["format", list(FORMATS) + " — preselected download format", "gif"],
  ["c / config", "Full config as lz-string (compressToEncodedURIComponent) or base64url JSON", "N4Ig…"],
  ["embed", "1 = show only the code (for iframes)", "1"],
];

const EXAMPLES = [
  "?data=https%3A%2F%2Fexample.com",
  "?text=Hello%20World&fg=%23ff0000&bg=%23ffffff&size=400",
  "generate/?data=WIFI:T:WPA;S:MyNetwork;P:password123;;&ec=H&anim=pulse",
  "?data=https%3A%2F%2Fgithub.com&module=dots&eye=circle&gradient=linear-45-0ea5e9-7c3aed&anim=wave",
  "?data=Hello&frame=label&frameText=SCAN%20ME&frameColor=4f46e5&module=vbars",
  "?data=https%3A%2F%2Fexample.com&anim=colorCycle&embed=1",
];

function Code({ children }: { children: string }) {
  return <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>;
}

function Md({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) => (part.startsWith("`") ? <Code key={i}>{part.slice(1, -1)}</Code> : part))}
    </>
  );
}

export default function Docs() {
  return (
    <Shell>
      <JsonLd
        data={breadcrumbSchema([
          { name: "QR code generator", path: "/" },
          { name: "URL API", path: "/docs/" },
        ])}
      />
      <div className="mx-auto max-w-4xl space-y-10 px-4 pb-16">
        <section className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">URL API</h1>
          <p className="text-muted">
            Every option of the generator can be driven by the page URL. Opening a link with a <Code>data</Code> (or{" "}
            <Code>text</Code>) parameter generates the code immediately, applies the style and starts the animation. Use{" "}
            <em>Copy shareable link</em> in the app to get a link for any design.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Examples</h2>
          <ul className="space-y-2">
            {EXAMPLES.map((e) => (
              <li key={e}>
                <Link href={`/${e}`} className="block break-all rounded-lg border border-line bg-surface p-3 font-mono text-sm hover:border-accent">
                  /{e}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Parameters</h2>
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-muted">
                <tr>
                  <th className="p-3 font-medium">Parameter</th>
                  <th className="p-3 font-medium">Description</th>
                  <th className="p-3 font-medium">Example</th>
                </tr>
              </thead>
              <tbody>
                {PARAMS.map(([p, d, e]) => (
                  <tr key={p} className="border-t border-line align-top">
                    <td className="whitespace-nowrap p-3 font-mono">{p}</td>
                    <td className="p-3">
                      <Md text={d} />
                    </td>
                    <td className="break-all p-3 font-mono text-xs text-muted">{e}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted">
            Parameter names are case-insensitive. Invalid values are ignored and fall back to defaults. Simple parameters override
            values inside <Code>c</Code>, so you can tweak a shared link by appending e.g. <Code>&amp;anim=scan</Code>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Safety &amp; limits</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            <li>Content is limited to {LIMITS.dataMaxChars} characters (and to what fits in a QR code at the chosen error-correction level).</li>
            <li>
              Content from a link starting with <Code>javascript:</Code>, <Code>vbscript:</Code>, <Code>data:</Code> or <Code>file:</Code> is
              blocked.
            </li>
            <li>Logos must be http(s) URLs (or images uploaded in the app). Colours must be hex values.</li>
            <li>Everything is rendered locally in the browser; no data is sent to any server.</li>
          </ul>
        </section>
      </div>
    </Shell>
  );
}
