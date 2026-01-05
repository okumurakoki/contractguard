import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Turbopackのルートディレクトリを明示的に設定
  turbopack: {
    root: path.resolve(__dirname),
  },
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
