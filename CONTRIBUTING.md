# Contributing to AnimQR

Thanks for helping! AnimQR is a static, fully client-side Next.js app.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit + URL + scannability tests
npm run typecheck
npm run build      # static export into ./out
```

## Project layout

| Path | What lives there |
|------|------------------|
| `src/lib/config.ts` | Config model, defaults, validation, **URL parsing & share links** |
| `src/lib/qr/matrix.ts` | QR encoding (via `qrcode-generator`, UTF-8) + finder/alignment lookup |
| `src/lib/qr/shapes.ts` | Module / eye shapes as path commands shared by canvas and SVG |
| `src/lib/qr/animations.ts` | Animation presets — pure functions of `(row, col, t)` |
| `src/lib/qr/render.ts` | Layout, canvas renderer and SVG renderer |
| `src/lib/export/` | PNG / JPEG / SVG / GIF (`gifenc`) / video (`MediaRecorder`) export |
| `src/components/` | React UI |
| `tests/` | Vitest suites; `scannability.test.ts` renders real frames and decodes them |

## Guidelines

- **Scannability first.** New shapes or animations must pass `tests/scannability.test.ts`.
  Animations that hide modules must *not* be listed in `SAFE_ANIMATIONS`.
- **Everything stays client-side.** No tracking, no required servers.
- **New options must be URL-addressable.** Add them to `QRConfig`, `DEFAULT_CONFIG`,
  `sanitizeConfig`, `SIMPLE_KEYS`, the docs page (`app/docs/page.tsx`) and the README table,
  with tests in `tests/config.test.ts`.
- Keep PRs focused, and include a share link or GIF for visual changes.

By contributing you agree that your contributions are licensed under the MIT License and
that you follow our [Code of Conduct](CODE_OF_CONDUCT.md).
