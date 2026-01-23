import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  // Static export는 프로덕션 빌드에서만 활성화
  ...(isProd && { output: 'export' }),
  trailingSlash: true,
  reactStrictMode: true,
  transpilePackages: ['@ax/api-client', '@ax/types', '@ax/utils', '@ax/config', '@ax/ui'],
  experimental: {
    optimizePackageImports: ['@ax/ui'],
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
