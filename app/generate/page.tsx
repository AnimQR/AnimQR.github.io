import type { Metadata } from "next";
import { Generator } from "@/components/Generator";
import { Shell } from "@/components/Shell";
import { pageMetadata } from "@/lib/metadata";
import { SITE } from "@/lib/site";

// `/generate/?data=…` is an alias of the home page for URL-driven generation.
// Its content depends on the query string, so it points search engines at the home page.
export const metadata: Metadata = {
  ...pageMetadata({ title: SITE.title, description: SITE.description, path: "/", absoluteTitle: true, noindex: true }),
};

export default function GeneratePage() {
  return (
    <Shell>
      <h1 className="sr-only">QR code generated from a link</h1>
      <Generator />
    </Shell>
  );
}
