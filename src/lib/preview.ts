import { initialState } from "./defaults";
import type { PageDefaults } from "./landing";
import { buildModel, renderSvg } from "./qr/render";

/** Server-side SVG of a page's starting code, so the preview is visible before JavaScript runs. */
export function initialPreview(defaults: PageDefaults): { svg: string; alt: string } {
  const { config } = initialState(defaults);
  const t = config.anim === "reveal" || config.anim === "particle" ? 0.7 : 0;
  // The logo (if any) is loaded client-side; the pre-render shows the code without it.
  const svg = renderSvg(buildModel({ ...config, logo: "", size: 480 }), t);
  const firstLine = config.data.split("\n")[0].slice(0, 80);
  return { svg, alt: `QR code for ${firstLine}` };
}
