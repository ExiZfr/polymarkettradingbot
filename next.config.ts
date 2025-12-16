import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for better PM2 integration
  // This creates a minimal standalone folder that can be deployed without node_modules
  output: 'standalone',

  // Exclude Python venv and scripts from build
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/venv/**', '**/scripts/**', '**/node_modules/**'],
    };
    return config;
  },

  // Exclude directories from Turbopack
  outputFileTracingExcludes: {
    '*': ['./venv/**', './scripts/**'],
  },

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

