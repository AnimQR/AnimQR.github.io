# AnimQR

**Free and open-source generator for styled, animated QR codes.** It runs entirely in your
browser, with no sign-up and no tracking, and nothing you type is uploaded.

**Live demo:** https://animqr.github.io

- **Content types:** URL, text, Wi-Fi, vCard, email, phone and SMS
- **Styling:** colours, linear/radial gradients, 7 module shapes, 4 corner-eye styles,
  eye colour, logo (upload or URL) with automatic safe area, frames with a "SCAN ME" label,
  error correction L/M/Q/H and quiet-zone control
- **Animations:** pulse, wave, shimmer, rotate, colour cycle, scan line, reveal and particles,
  with adjustable duration, FPS and loop count
- **Export:** PNG, JPEG, SVG, animated GIF, WebM and MP4 (MP4 only where the browser can record it)
- **URL-driven generation:** every option can be set from the link, so opening it renders the code
- **Built-in scannability check:** frames are decoded in the browser (jsQR) as you edit
- **Presets:** built-in styles, plus your own saved in `localStorage`
- **Embed mode:** `?embed=1` shows only the code, for iframes
- **Guided, mobile-first editor:** numbered Content → Style → Animate steps, a live mini-preview
  that follows you while you edit, a thumb-friendly download/share bar on phones, native share
  sheet support, undo/redo (Ctrl/Cmd+Z), and light/dark/system themes
- **Preloaded URL:** first-time visitors see a ready-made, scannable code instead of an empty form
- **SEO-ready:** landing pages for each use case, a sitemap, robots.txt, structured data,
  social cards, favicons and a web app manifest (see [SEO](#seo))

## URL API

Open the app with a `data` (or `text`) parameter and it generates the code immediately:

```
https://animqr.github.io/?data=https%3A%2F%2Fexample.com
https://animqr.github.io/?text=Hello%20World&fg=%23ff0000&bg=%23ffffff&size=400
https://animqr.github.io/generate/?data=WIFI:T:WPA;S:MyNetwork;P:password123;;&ec=H&anim=pulse
https://animqr.github.io/?data=https%3A%2F%2Fgithub.com&module=dots&eye=circle&gradient=linear-45-800020-0a1f44&anim=wave
https://animqr.github.io/?c=N4IgLgpg...   (full compressed config, produced by "Copy shareable link")
```

| Parameter | Description | Example |
|-----------|-------------|---------|
| `data` / `text` | Content to encode (required to generate) | `https%3A%2F%2Fx.ai` |
| `ec` | Error correction `L` `M` `Q` `H` | `H` |
| `size` | Export size in px (128–2048) | `512` |
| `margin` | Quiet zone in modules (0–10) | `4` |
| `fg` / `bg` | Foreground / background hex colour (`#` optional); `bg=transparent` works too | `%23ff5500` |
| `gradient` | `linear-<angle>-<from>-<to>` or `radial-<from>-<to>` | `linear-45-ff0-f0f` |
| `module` | `square` `rounded` `dots` `diamond` `star` `vbars` `hbars` | `dots` |
| `eye` | `square` `rounded` `circle` `leaf` | `rounded` |
| `eyeColor` | Corner-eye colour | `800020` |
| `logo` | http(s) image URL (the server must send CORS headers) | `https://…/logo.png` |
| `logoSize` | Logo width as a fraction of the code (0.08–0.3, capped by `ec`) | `0.22` |
| `frame` | `none` `square` `rounded` `label` | `label` |
| `frameText` / `frameColor` | Label text (≤ 40 chars) and frame colour | `SCAN%20ME` |
| `anim` | `none` `pulse` `wave` `fade` `rotate` `colorCycle` `scan` `reveal` `particle` | `pulse` |
| `duration` | Loop duration in ms (300–10000) | `2000` |
| `fps` | Frames per second (5–60) | `15` |
| `loop` | GIF loop count, `0` = forever | `0` |
| `format` | Preselected download: `png` `svg` `jpeg` `gif` `webm` `mp4` | `gif` |
| `c` / `config` | Full config as lz-string `compressToEncodedURIComponent` JSON, or base64url JSON | |
| `embed` | `1` shows only the code | `1` |

Keys are case-insensitive. Invalid values are ignored and fall back to their defaults. Simple
parameters override values inside `c`, so you can tweak a shared link by appending, say,
`&anim=scan`. The same reference is in the app at [`/docs/`](https://animqr.github.io/docs/).

**Safety:** content is capped at 2048 characters. Content that starts with `javascript:`,
`vbscript:`, `data:` or `file:` is rejected, and so are control characters. Logos must be
http(s) or uploaded images, and colours must be hex. Everything renders locally.

## SEO

AnimQR scores 100 for SEO in Lighthouse. Search engines get:

| What | Where |
|------|-------|
| Unique `<title>`, description, keywords and canonical URL per page | `src/lib/metadata.ts` |
| Open Graph + Twitter cards with a 1200×630 image (its QR code scans to the site) | `app/opengraph-image.png`, `app/twitter-image.png` |
| Favicons: `favicon.ico` (16/32/48), SVG icon, Apple touch icon, PWA icons (192/512 + maskable) | `app/`, `public/`, `app/manifest.ts` |
| `sitemap.xml` and `robots.txt` (the query-driven `/generate/` alias is `noindex`) | `app/sitemap.ts`, `app/robots.ts` |
| JSON-LD: `WebSite`, `Organization`, `WebApplication`, `HowTo`, `FAQPage`, `BreadcrumbList` | `src/lib/schema.ts` |
| Server-rendered H1, intro, how-to steps, features, FAQ and internal links, plus a pre-rendered SVG of the code (visible without JavaScript) | `src/components/seo/` |
| Landing pages: animated QR, QR GIF, QR with logo, Wi-Fi, vCard, URL | `src/lib/landing.ts` |

### SEO options

Set these at build time. For the GitHub Pages workflow, add them as repository **variables**
under *Settings → Secrets and variables → Actions → Variables*, using the names in brackets:

| Env var (repo variable) | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` (`SITE_URL`) | Public URL used for canonical links, sitemap and social cards | `https://animqr.github.io` |
| `NEXT_PUBLIC_PRELOAD_URL` (`PRELOAD_URL`) | URL encoded in the code first-time visitors see | the site URL |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (`GOOGLE_SITE_VERIFICATION`) | Google Search Console token | — |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` (`BING_SITE_VERIFICATION`) | Bing Webmaster Tools token | — |
| `NEXT_PUBLIC_YANDEX_VERIFICATION` (`YANDEX_VERIFICATION`) | Yandex Webmaster token | — |
| `NEXT_PUBLIC_PINTEREST_VERIFICATION` (`PINTEREST_VERIFICATION`) | Pinterest domain verification | — |
| `NEXT_PUBLIC_TWITTER_HANDLE` (`TWITTER_HANDLE`) | `@handle` for Twitter/X cards | — |
| `NEXT_PUBLIC_NOINDEX` (`NOINDEX`) | `1` blocks indexing (staging/preview builds) | — |

Titles, descriptions and keywords live in `src/lib/site.ts`, and the use-case pages live in
`src/lib/landing.ts`. To add a landing page, add an entry there and it's picked up by the
sitemap, footer and internal links automatically. `tests/seo.test.ts` checks title and
description lengths. After changing the artwork, regenerate the icons and social images with
`npm run assets`.

After the first deploy, submit `https://animqr.github.io/sitemap.xml` in Google Search Console
and Bing Webmaster Tools.

## Scannability

Animations never touch the three finder patterns or the alignment patterns, and the
"safe" presets never hide a module. Modules keep at least 75% of their size and 55% opacity,
and colour cycling keeps lightness, so contrast doesn't drop. `reveal` and `particle` only
scan during their hold phase, and the UI marks them with ◐. `tests/scannability.test.ts`
renders every module shape × animation × 10 frames with the real renderer and decodes each
one. Still, test with a real phone before you print anything.

## Tech stack

- [Next.js](https://nextjs.org) (App Router, `output: "export"`) + TypeScript: a fully static
  site, so it works on **GitHub Pages**
- Tailwind CSS v4 and Zustand
- [`qrcode-generator`](https://github.com/kazuhikoarase/qrcode-generator) for encoding, plus
  its own canvas/SVG renderer for styles and animation
- [`gifenc`](https://github.com/mattdesl/gifenc) for GIFs, `MediaRecorder` for WebM/MP4, and
  [`jsQR`](https://github.com/cozmo/jsQR) for the scan check
- [`lz-string`](https://github.com/pieroxy/lz-string) for compact share links
- Vitest + `@napi-rs/canvas` for tests

## Development

```bash
npm install
npm run dev         # http://localhost:3000
npm test            # unit, URL and scannability tests
npm run typecheck
npm run build       # static site in ./out
```

## Deploying / self-hosting

**GitHub Pages (this repo):** in *Settings → Pages*, set **Source** to **GitHub Actions**.
Every push to `main` then builds and deploys via `.github/workflows/deploy.yml`.

**Your own fork as a project site** (`https://<you>.github.io/<repo>/`): set
`NEXT_PUBLIC_BASE_PATH: "/<repo>"` in the deploy workflow.

**Any static host** (Netlify, Cloudflare Pages, Vercel, S3, nginx…): run `npm run build`
and serve the `out/` directory.

## Roadmap

- [x] Core generator, styling, logo, frames, PNG/SVG/JPEG export
- [x] URL-driven generation, share links, embed mode
- [x] Animation engine, GIF + WebM/MP4 export, scannability check
- [x] Presets and saved styles
- [ ] APNG export, custom SVG modules, batch generation
- [ ] Lottie / CSS animation export
- [ ] i18n
- [ ] Optional short-link service

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) and the
[Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE). QR Code is a registered trademark of DENSO WAVE INCORPORATED.
