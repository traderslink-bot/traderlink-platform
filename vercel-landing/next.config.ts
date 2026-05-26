import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.traderslink.pro",
          },
        ],
        destination: "https://traderslink.pro/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
