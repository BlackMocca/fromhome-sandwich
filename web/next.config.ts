import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Turbopack for fast development (inherits from Bun environment)
};

export default nextConfig;
