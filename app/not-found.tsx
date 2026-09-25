import Link from "next/link";
import { Shell } from "@/components/Shell";

export default function NotFound() {
  return (
    <Shell>
      <main className="mx-auto max-w-6xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-muted">
          <Link className="underline" href="/">
            Back to the generator
          </Link>
        </p>
      </main>
    </Shell>
  );
}
