import { ModelRouterEmbeddingModel, ModelRouterLanguageModel } from "@mastra/core/llm";
import type { LLMProvider } from "../types/core.types";

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  openai: "openai/gpt-4o-mini",
  anthropic: "anthropic/claude-sonnet-4-20250514",
  groq: "groq/llama-3.3-70b-versatile",
  ollama: "ollama/llama3.2",
};

const EMBEDDING_MODEL = "openai/text-embedding-3-small";

export const CHUNK_SIZE = 512;
export const CHUNK_OVERLAP = 50;

export function getModelString(): string {
  const provider = process.env.LLM_PROVIDER as LLMProvider;
  const customModel = process.env.LLM_MODEL;

  if (customModel) {
    return `${provider}/${customModel}`;
  }

  return DEFAULT_MODELS[provider] || DEFAULT_MODELS.openai;
}

let embeddingModelInstance: ModelRouterEmbeddingModel | null = null;

export function getEmbeddingModel(): ModelRouterEmbeddingModel {
  if (!embeddingModelInstance) {
    embeddingModelInstance = new ModelRouterEmbeddingModel(EMBEDDING_MODEL);
  }
  return embeddingModelInstance;
}

let languageModelInstance: ModelRouterLanguageModel | null = null;

export function getLanguageModel(): ModelRouterLanguageModel {
  if (!languageModelInstance) {
    languageModelInstance = new ModelRouterLanguageModel(getModelString());
  }
  return languageModelInstance;
}
