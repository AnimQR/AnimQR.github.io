import { describe, expect, it } from "vitest";
import { buildEmail, buildPhone, buildSms, buildVCard, buildWifi, detectContentType } from "@/lib/content";

describe("content builders", () => {
  it("builds Wi-Fi strings with escaping", () => {
    expect(buildWifi({ ssid: "My;Net", password: 'p:a"ss', security: "WPA", hidden: true })).toBe(
      'WIFI:T:WPA;S:My\\;Net;P:p\\:a\\"ss;H:true;;',
    );
    expect(buildWifi({ ssid: "Open", password: "ignored", security: "nopass", hidden: false })).toBe("WIFI:T:nopass;S:Open;;");
    expect(buildWifi({ ssid: "", password: "", security: "WPA", hidden: false })).toBe("");
  });

  it("builds vCards", () => {
    const v = buildVCard({ firstName: "Ada", lastName: "Lovelace", org: "A, B", title: "", phone: "+1", email: "a@b.c", url: "", address: "" });
    expect(v).toContain("BEGIN:VCARD");
    expect(v).toContain("N:Lovelace;Ada;;;");
    expect(v).toContain("FN:Ada Lovelace");
    expect(v).toContain("ORG:A\\, B");
    expect(v).toContain("TEL;TYPE=CELL:+1");
    expect(v.endsWith("END:VCARD")).toBe(true);
  });

  it("builds mailto, tel and sms", () => {
    expect(buildEmail({ to: "a@b.c", subject: "Hi there", body: "x&y" })).toBe("mailto:a@b.c?subject=Hi%20there&body=x%26y");
    expect(buildPhone("+1 (555) 123-4567")).toBe("tel:+15551234567");
    expect(buildSms({ phone: "555 1234", message: "yo" })).toBe("SMSTO:5551234:yo");
  });

  it("detects URLs", () => {
    expect(detectContentType("https://x.ai").type).toBe("url");
    expect(detectContentType("hello").type).toBe("text");
  });
});
