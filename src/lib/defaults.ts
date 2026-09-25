import { sanitizeConfig, type QRConfig } from "./config";
import { buildContent, EMPTY_FIELDS, type ContentFields, type ContentType } from "./content";
import type { PageDefaults } from "./landing";
import { SITE } from "./site";

export const HOME_DEFAULTS: PageDefaults = { contentType: "url", fields: {}, style: {} };

/** Starting state for a page: its sample content (URL pages get the preloaded URL) and style. */
export function initialState(defaults: PageDefaults): { config: QRConfig; contentType: ContentType; fields: ContentFields } {
  const fields: ContentFields = { ...EMPTY_FIELDS, ...defaults.fields };
  if (defaults.contentType === "url" && !fields.url) fields.url = SITE.preloadUrl;
  const data = buildContent(defaults.contentType, fields);
  const config = sanitizeConfig({ ...defaults.style, data });
  return { config, contentType: defaults.contentType, fields };
}
