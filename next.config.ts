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
  // The game is a single client-rendered page; trailing slash keeps asset
  // paths consistent when hosted as static files.
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
