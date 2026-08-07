import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  turbopack: {},
  images: {
    unoptimized: true,
  },
  // Minimize JS output
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  // Experimental optimizations
  experimental: {
    // Optimize package imports — prevents loading entire library for a few icons
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@tanstack/react-query",
    ],
  },
};

export default nextConfig;
