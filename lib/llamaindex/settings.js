/**
 * LlamaIndex.TS Settings Manager
 * Configures LLM and embedding models
 */

import { Settings } from "@llamaindex/core/global";
import { OpenAI, OpenAIEmbedding } from "@llamaindex/openai";
import { Anthropic } from "@llamaindex/anthropic";
import { Groq } from "@llamaindex/groq";
import { Ollama, OllamaEmbedding } from "@llamaindex/ollama";

// Note: LlamaIndex.TS provides dedicated packages for each LLM provider

/**
 * Configure the LLM provider based on environment variables
 */
export function configureLLM() {
  const provider = process.env.LLM_PROVIDER || "openai";
  const model = process.env.LLM_MODEL || "gpt-4o-mini";

  switch (provider) {
    case "openai":
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is required when using OpenAI provider");
      }
      Settings.llm = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        model: model,
        timeout: parseInt(process.env.LLM_TIMEOUT || "60000"), // Default 60 seconds
        contextWindow: parseInt(process.env.CONTEXT_WINDOW || "128000"),
      });
      break;

    case "anthropic":
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY is required when using Anthropic provider");
      }
      Settings.llm = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: model || "claude-3-haiku-20240307",
        timeout: parseInt(process.env.LLM_TIMEOUT || "60000"),
        contextWindow: parseInt(process.env.CONTEXT_WINDOW || "200000"),
      });
      break;

    case "groq":
      if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is required when using Groq provider");
      }
      Settings.llm = new Groq({
        apiKey: process.env.GROQ_API_KEY,
        model: model || "llama-3.3-70b-versatile",
        timeout: parseInt(process.env.LLM_TIMEOUT || "60000"),
        contextWindow: parseInt(process.env.CONTEXT_WINDOW || "128000"),
      });
      break;

    case "ollama":
      // Ollama runs locally - use LlamaIndex.TS Ollama provider
      const ollamaBaseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
      Settings.llm = new Ollama({
        baseURL: ollamaBaseURL,
        model: model || "llama2",
        timeout: parseInt(process.env.LLM_TIMEOUT || "120000"), // Ollama may need more time
        contextWindow: parseInt(process.env.CONTEXT_WINDOW || "4096"),
      });
      break;

    default:
      throw new Error(`Unsupported LLM provider: ${provider}. Supported providers: openai, anthropic, groq, ollama`);
  }

  return Settings.llm;
}

/**
 * Configure the embedding model
 * Supports multiple embedding providers
 */
export function configureEmbedding() {
  const embeddingProvider = process.env.EMBEDDING_PROVIDER || "openai";
  const embeddingModel = process.env.EMBEDDING_MODEL || "text-embedding-3-small";

  switch (embeddingProvider) {
    case "openai":
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is required for OpenAI embeddings");
      }
      Settings.embedModel = new OpenAIEmbedding({
        apiKey: process.env.OPENAI_API_KEY,
        model: embeddingModel,
        timeout: parseInt(process.env.EMBEDDING_TIMEOUT || "60000"),
      });
      break;

    case "ollama":
      const ollamaEmbeddingModel = process.env.OLLAMA_EMBEDDING_MODEL || embeddingModel;
      const ollamaBaseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
      Settings.embedModel = new OllamaEmbedding({
        baseURL: ollamaBaseURL,
        model: ollamaEmbeddingModel,
        timeout: parseInt(process.env.EMBEDDING_TIMEOUT || "60000"),
      });
      break;

    default:
      throw new Error(`Unsupported embedding provider: ${embeddingProvider}. Supported providers: openai, ollama`);
  }

  return Settings.embedModel;
}

/**
 * Initialize all settings (LLM and embeddings)
 */
export function initializeSettings() {
  configureLLM();
  configureEmbedding();
}

/**
 * Update the LLM provider at runtime
 */
export function updateLLMProvider(provider, model) {
  process.env.LLM_PROVIDER = provider;
  if (model) {
    process.env.LLM_MODEL = model;
  }
  configureLLM();
}

/**
 * Get current LLM configuration
 */
export function getLLMConfig() {
  return {
    provider: process.env.LLM_PROVIDER || "openai",
    model: process.env.LLM_MODEL || "gpt-4o-mini",
  };
}
