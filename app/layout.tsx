import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnimQR — Animated & styled QR code generator",
  description:
    "Free and open-source generator for styled, animated QR codes. Export PNG, SVG, GIF, MP4 and WebM. Create codes straight from a URL. Runs entirely in your browser.",
  applicationName: "AnimQR",
  openGraph: {
    title: "AnimQR — Animated & styled QR codes",
    description: "Free & open-source. Styled, animated QR codes with GIF/video export and URL-driven generation.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0d14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
