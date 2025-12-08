import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow both domains
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'polygraalx.app',
          },
        ],
        destination: 'https://app.polygraalx.app/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.polygraalx.app',
          },
        ],
        destination: 'https://app.polygraalx.app/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

