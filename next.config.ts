import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
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
