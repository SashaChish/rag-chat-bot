import { Settings } from "@llamaindex/core/global";
import { OpenAI, OpenAIEmbedding } from "@llamaindex/openai";
import { Anthropic } from "@llamaindex/anthropic";
import { Groq } from "@llamaindex/groq";
import { Ollama, OllamaEmbedding } from "@llamaindex/ollama";

export type LLMProvider = "openai" | "anthropic" | "groq" | "ollama";
export type EmbeddingProvider = "openai" | "ollama";

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
}

export function configureLLM(): unknown {
  const provider = (process.env.LLM_PROVIDER || "openai") as LLMProvider;
  const model = process.env.LLM_MODEL || "gpt-4o-mini";

  switch (provider) {
    case "openai":
      if (!process.env.OPENAI_API_KEY) {
        throw new Error(
          "OPENAI_API_KEY is required when using OpenAI provider",
        );
      }
      Settings.llm = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        model: model,
        timeout: 60000,
      });
      break;
    case "anthropic":
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error(
          "ANTHROPIC_API_KEY is required when using Anthropic provider",
        );
      }
      Settings.llm = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: model || "claude-3-5-sonnet-20241022",
        timeout: 60000,
      });
      break;
    case "groq":
      if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is required when using Groq provider");
      }
      Settings.llm = new Groq({
        apiKey: process.env.GROQ_API_KEY,
        model: model || "llama-3.1-8b-versatile",
        timeout: 60000,
      });
      break;
    case "ollama":
      const ollamaModel = process.env.OLLAMA_MODEL || model || "llama3.2";
      Settings.llm = new Ollama({
        model: ollamaModel,
      });
      break;
    default:
      throw new Error(
        `Unsupported LLM provider: ${provider}. Supported providers: openai, anthropic, groq, ollama`,
      );
  }

  return Settings.llm;
}

export function configureEmbedding(): unknown {
  const embeddingProvider = (process.env.EMBEDDING_PROVIDER ||
    "openai") as EmbeddingProvider;
  const embeddingModel =
    process.env.EMBEDDING_MODEL || "text-embedding-3-small";

  switch (embeddingProvider) {
    case "openai":
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is required for OpenAI embeddings");
      }
      Settings.embedModel = new OpenAIEmbedding({
        apiKey: process.env.OPENAI_API_KEY,
        model: embeddingModel,
        timeout: 60000,
      });
      break;
    case "ollama":
      const ollamaEmbeddingModel =
        process.env.OLLAMA_EMBEDDING_MODEL || embeddingModel;
      Settings.embedModel = new OllamaEmbedding({
        model: ollamaEmbeddingModel,
      });
      break;
    default:
      throw new Error(
        `Unsupported embedding provider: ${embeddingProvider}. Supported providers: openai, ollama`,
      );
  }

  return Settings.embedModel;
}

export function initializeSettings(): void {
  configureLLM();
  configureEmbedding();
}
