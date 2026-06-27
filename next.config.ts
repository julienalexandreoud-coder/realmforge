import type { NextConfig } from "next";

// CrazyGames requires a fully static HTML5 build (no server-side rendering,
// no API routes). `output: "export"` produces a self-contained `out/` folder.
// The leaderboard is localStorage-only (see gameStore.ts) so no server is needed.
const nextConfig: NextConfig = {
  output: "export",
  images: {
    // CrazyGames static hosting can't optimize images on the fly.
    unoptimized: true,
  },
  // NO trailingSlash — CrazyGames serves the game from a subdirectory, and
  // trailing slashes + absolute paths break asset loading there.
  trailingSlash: false,
  // Use RELATIVE asset paths so the game works when hosted in a subdirectory
  // (CrazyGames serves games inside an iframe at a sub-path).
  // Without this, Next emits absolute paths like "/_next/..." which 404.
  assetPrefix: "./",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
