import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  transpilePackages: ['@knowman/types'],
  experimental: {
    serverComponentsExternalPackages: ['@knowman/types']
  }
}

export default nextConfig