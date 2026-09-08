import type { NextConfig } from "next";

process.env.TZ = "Africa/Lagos";

const nextConfig: NextConfig = {
  env: {
    TZ: "Africa/Lagos",
    NEXT_PUBLIC_DEFAULT_TIMEZONE: "Africa/Lagos",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;

