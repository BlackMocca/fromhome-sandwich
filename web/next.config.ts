import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false, // will prevent building if there are TypeScript errors
  },
};

export default nextConfig;
