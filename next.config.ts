import type { NextConfig } from "next";

// CrazyGames requires a fully static HTML5 build (no server-side rendering,
// no API routes). `output: "export"` produces a self-contained `out/` folder.
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // trailingSlash + assetPrefix together ensure relative paths work whether
  // CrazyGames serves the game at /game/ or /game/index.html
  trailingSlash: true,
  assetPrefix: "./",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
