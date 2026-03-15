/**
 * Engine and Agent Type Definitions
 * Type definitions for LlamaIndex.TS engines, agents, and configurations
 */

import type {
  VectorStoreIndex,
  ReActAgent,
  BaseLLM,
  BaseEmbedding
} from "llamaindex";

/**
 * VectorStoreIndex type
 * Represents the index for document storage and retrieval
 */
export type IndexType = VectorStoreIndex;

/**
 * Query engine return type
 * Can be different types of query engines based on configuration
 */
export type QueryEngineReturnType = unknown;

/**
 * Chat engine return type
 * Can be different types of chat engines based on configuration
 */
export type ChatEngineReturnType = unknown;

/**
 * ReAct agent type
 * Represents a ReAct agent with reasoning and action capabilities
 */
export type AgentEngineType = ReActAgent;

/**
 * LLM type
 * Represents a Large Language Model instance
 */
export type LLMType = BaseLLM;

/**
 * Embedding model type
 * Represents an embedding model for vectorization
 */
export type EmbeddingModelType = BaseEmbedding;

/**
 * Query engine configuration options
 */
export interface QueryEngineOptions {
  retrieverMode?: 'default' | 'hybrid' | 'custom';
  responseMode?: 'default' | 'compact' | 'tree_summarize' | 'refine' | 'simple_summarize';
  similarityTopK?: number;
  streaming?: boolean;
}

/**
 * Chat engine configuration options
 */
export interface ChatEngineOptions {
  verbose?: boolean;
  systemPrompt?: string;
  contextWindow?: number;
}

/**
 * Agent configuration options
 */
export interface AgentOptions {
  verbose?: boolean;
  maxIterations?: number;
  systemPrompt?: string;
  contextWindow?: number;
  [key: string]: unknown; // Allow additional properties for flexibility
}

/**
 * LLM configuration
 */
export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'groq' | 'ollama';
  model: string;
}

/**
 * Embedding configuration
 */
export interface EmbeddingConfig {
  provider: 'openai' | 'ollama';
  model: string;
}
