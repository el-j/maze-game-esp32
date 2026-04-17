import type { NextConfig } from "next";

// NEXT_PUBLIC_BASE_PATH is injected by CI when building for GitHub Pages
// (e.g. "/maze-game-esp32").  Empty string for local development.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",       // fully static – works on GitHub Pages
  trailingSlash: true,    // /about/ instead of /about  (required for Pages)
  basePath,
  images: {
    unoptimized: true,    // next/image optimisation requires a server
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
