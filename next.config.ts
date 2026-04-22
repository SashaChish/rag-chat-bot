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
  serverExternalPackages: [
    "chromadb",
    "chromadb-default-embed",
    "@chroma-core/default-embed",
    "@huggingface/transformers",
    "onnxruntime-node",
  ],
};

export default nextConfig;
