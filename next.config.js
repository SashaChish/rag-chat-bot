/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config) => {
    // Exclude ChromaDB and its native dependencies from bundling
    // They will be loaded at runtime via Node.js's require
    const nativeModules = ['chromadb', '@chroma-core/default-embed', '@huggingface/transformers', 'onnxruntime-node'];
    config.externals = [...(config.externals || []), ...nativeModules];

    return config;
  },
}

module.exports = nextConfig
