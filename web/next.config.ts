import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Turbopack for fast development (inherits from Bun environment)
  transpilePackages: ['tw-animate-css', 'shadcn'],
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
