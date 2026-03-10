import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack root to avoid multi-lockfile warning
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },

  // Proxy API requests to FastAPI backend
  async rewrites() {
    return [
      // Paths que ya incluyen /v1 (mayoría de llamadas desde pages)
      {
        source: "/api/v1/:path*",
        destination: "https://vocari-api.fly.dev/api/v1/:path*",
      },
      // Paths sin /v1 (auth-store, token refresh, etc.)
      {
        source: "/api/:path*",
        destination: "https://vocari-api.fly.dev/api/v1/:path*",
      },
    ];
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google profile pictures
      },
    ],
  },

  // Strict mode for development
  reactStrictMode: true,

  // Output standalone for Docker
  output: "standalone",
};

export default nextConfig;
