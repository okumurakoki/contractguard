import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 画像の外部ドメインを許可（S3など）
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;
