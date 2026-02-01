/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@axis-ds/ui-react', '@axis-ds/theme', '@axis-ds/tokens'],
  experimental: {
    optimizePackageImports: ['@axis-ds/ui-react'],
  },
}

export default nextConfig
