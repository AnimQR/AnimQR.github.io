"use client";

import { toast } from "./toast";

export async function copyText(text: string, success = "Copied to clipboard") {
  try {
    await navigator.clipboard.writeText(text);
    toast(success);
    return true;
  } catch {
    window.prompt("Copy this:", text);
    return false;
  }
}

export function canNativeShare() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/** Share via the OS share sheet (mobile), falling back to copying the link. */
export async function shareLink(url: string, title = "My QR code — AnimQR") {
  if (canNativeShare()) {
    try {
      await navigator.share({ title, url });
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
  }
  await copyText(url, "Link copied — anyone who opens it sees this exact code");
}

/** Share the exported file itself where supported (e.g. straight into a chat app). */
export async function shareFile(blob: Blob, filename: string): Promise<boolean> {
  const file = new File([blob], filename, { type: blob.type });
  if (canNativeShare() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return true;
    } catch (e) {
      if ((e as Error).name === "AbortError") return true;
    }
  }
  return false;
}
