import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Content Security Policy to be set per-page
  // The extension bridge script uses postMessage to communicate, which is safe
  async headers() {
    return [
      {
        source: "/capture/:path*",
        headers: [
          // Allow extension content scripts to access the page
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
