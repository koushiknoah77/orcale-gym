import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        pathname: '/coins/images/**',
      },
      {
        protocol: 'https',
        hostname: '**.walletconnect.com',
      },
      {
        protocol: 'https',
        hostname: '**.walletconnect.org',
      },
    ],
  },
};

export default nextConfig;
