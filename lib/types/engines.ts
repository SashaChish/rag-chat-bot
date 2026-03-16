import type { ReActAgent, BaseEmbedding } from "llamaindex";

/**
 * ReAct agent type
 * Represents a ReAct agent with reasoning and action capabilities
 */
export type AgentEngineType = ReActAgent;

/**
 * Embedding model type
 * Represents an embedding model for vectorization
 */
export type EmbeddingModelType = BaseEmbedding;

/**
 * Agent configuration options
 */
export interface AgentOptions {
  verbose?: boolean;
  maxIterations?: number;
  systemPrompt?: string | null;
  contextWindow?: number;
  [key: string]: unknown; // Allow additional properties for flexibility
}

/**
 * LLM configuration
 */
export interface LLMConfig {
  provider: "openai" | "anthropic" | "groq" | "ollama";
  model: string;
}
