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
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/:path*`,
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
