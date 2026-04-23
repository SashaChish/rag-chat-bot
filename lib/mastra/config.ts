import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import type { LLMProvider } from "../types/core.types";

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  openai: "openai/gpt-4o-mini",
  anthropic: "anthropic/claude-sonnet-4-20250514",
  groq: "groq/llama-3.3-70b-versatile",
  ollama: "ollama/llama3.2",
};

const EMBEDDING_MODEL = "openai/text-embedding-3-small";

export function getModelString(): string {
  const provider = (process.env.LLM_PROVIDER || "openai") as LLMProvider;
  const customModel = process.env.LLM_MODEL;

  if (customModel) {
    return `${provider}/${customModel}`;
  }

  return DEFAULT_MODELS[provider] || DEFAULT_MODELS.openai;
}

export function getEmbeddingModel(): ModelRouterEmbeddingModel {
  return new ModelRouterEmbeddingModel(EMBEDDING_MODEL);
}
