import type { NextConfig } from "next";

// Static export so the app can be hosted on GitHub Pages (or any static host).
// Set NEXT_PUBLIC_BASE_PATH=/repo-name when hosting a project site under a sub-path.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
