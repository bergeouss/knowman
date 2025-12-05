import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  transpilePackages: ['@knowman/types'],
  serverExternalPackages: ['@knowman/types']
}

export default nextConfig