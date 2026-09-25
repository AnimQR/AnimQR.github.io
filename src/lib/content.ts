export const CONTENT_TYPES = ["url", "text", "wifi", "vcard", "email", "phone", "sms"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_LABELS: Record<ContentType, string> = {
  url: "URL",
  text: "Text",
  wifi: "Wi-Fi",
  vcard: "vCard",
  email: "Email",
  phone: "Phone",
  sms: "SMS",
};

export interface WifiFields {
  ssid: string;
  password: string;
  security: "WPA" | "WEP" | "nopass";
  hidden: boolean;
}

export interface VCardFields {
  firstName: string;
  lastName: string;
  org: string;
  title: string;
  phone: string;
  email: string;
  url: string;
  address: string;
}

export interface EmailFields {
  to: string;
  subject: string;
  body: string;
}

export interface SmsFields {
  phone: string;
  message: string;
}

export interface ContentFields {
  url: string;
  text: string;
  wifi: WifiFields;
  vcard: VCardFields;
  email: EmailFields;
  phone: string;
  sms: SmsFields;
}

export const EMPTY_FIELDS: ContentFields = {
  url: "",
  text: "",
  wifi: { ssid: "", password: "", security: "WPA", hidden: false },
  vcard: { firstName: "", lastName: "", org: "", title: "", phone: "", email: "", url: "", address: "" },
  email: { to: "", subject: "", body: "" },
  phone: "",
  sms: { phone: "", message: "" },
};

/** Escape special characters for the MECARD-style Wi-Fi format. */
export function escapeWifi(s: string) {
  return s.replace(/([\;,:"])/g, "\\$1");
}

/** Escape per RFC 6350 (vCard 3/4 text values). */
export function escapeVCard(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
}

export function buildWifi(f: WifiFields) {
  if (!f.ssid) return "";
  const parts = [`T:${f.security}`, `S:${escapeWifi(f.ssid)}`];
  if (f.security !== "nopass") parts.push(`P:${escapeWifi(f.password)}`);
  if (f.hidden) parts.push("H:true");
  return `WIFI:${parts.join(";")};;`;
}

export function buildVCard(f: VCardFields) {
  if (!Object.values(f).some((v) => v.trim())) return "";
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  lines.push(`N:${escapeVCard(f.lastName)};${escapeVCard(f.firstName)};;;`);
  lines.push(`FN:${escapeVCard([f.firstName, f.lastName].filter(Boolean).join(" ") || f.org)}`);
  if (f.org) lines.push(`ORG:${escapeVCard(f.org)}`);
  if (f.title) lines.push(`TITLE:${escapeVCard(f.title)}`);
  if (f.phone) lines.push(`TEL;TYPE=CELL:${escapeVCard(f.phone)}`);
  if (f.email) lines.push(`EMAIL:${escapeVCard(f.email)}`);
  if (f.url) lines.push(`URL:${escapeVCard(f.url)}`);
  if (f.address) lines.push(`ADR:;;${escapeVCard(f.address)};;;;`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

export function buildEmail(f: EmailFields) {
  if (!f.to && !f.subject && !f.body) return "";
  const q = new URLSearchParams();
  if (f.subject) q.set("subject", f.subject);
  if (f.body) q.set("body", f.body);
  const qs = q.toString().replace(/\+/g, "%20");
  return `mailto:${f.to.trim()}${qs ? "?" + qs : ""}`;
}

const cleanPhone = (p: string) => p.replace(/[^\d+*#]/g, "");

export function buildPhone(p: string) {
  const n = cleanPhone(p);
  return n ? `tel:${n}` : "";
}

export function buildSms(f: SmsFields) {
  const n = cleanPhone(f.phone);
  if (!n && !f.message) return "";
  return `SMSTO:${n}:${f.message}`;
}

export function buildContent(type: ContentType, fields: ContentFields): string {
  switch (type) {
    case "url":
      return fields.url.trim();
    case "text":
      return fields.text;
    case "wifi":
      return buildWifi(fields.wifi);
    case "vcard":
      return buildVCard(fields.vcard);
    case "email":
      return buildEmail(fields.email);
    case "phone":
      return buildPhone(fields.phone);
    case "sms":
      return buildSms(fields.sms);
  }
}

/** Best-effort guess of the content type of raw data (used for data coming from a URL). */
export function detectContentType(data: string): { type: ContentType; fields: Partial<ContentFields> } {
  if (/^https?:\/\/\S+$/i.test(data.trim())) return { type: "url", fields: { url: data.trim() } };
  return { type: "text", fields: { text: data } };
}
