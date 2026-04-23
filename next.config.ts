import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    optimizePackageImports: ['@mantine/core', '@mantine/hooks', '@mantine/dropzone', '@tabler/icons-react'],
  },
};

export default nextConfig;
