/**
 * Core RAG Types
 * Type definitions for LlamaIndex.TS document processing, query engines, and chat engines
 */

export interface DocumentMetadata {
  file_name: string;
  file_path?: string;
  file_type: string;
  upload_date: string;
  file_url?: string;
  stored_file_path?: string;
  page_label?: string;
  title?: string;
  author?: string;
  [key: string]: unknown;
}

export interface RAGDocument {
  text: string;
  metadata: DocumentMetadata;
}

/**
 * Source information extracted from query results
 */
export interface SourceInfo {
  filename: string;
  fileType: string;
  score: number;
  text?: string;
  preview?: string;
  metadata?: DocumentMetadata;
}

/**
 * Query response structure
 */
export interface QueryResponse {
  response: string | AsyncGenerator<QueryChunk> | ReadableStream<QueryChunk>;
  sources: SourceInfo[];
  streaming: boolean;
  error?: string;
  agent?: boolean;
}

/**
 * Query chunk for streaming responses
 * Can be either a text chunk or a structured chunk with metadata
 */
export interface QueryChunk {
  delta?: string;
  response?: string;
  content?: string;
  value?: string;
  text?: string;
  message?: ChatMessage;
  sourceNodes?: SourceNode[];
}

/**
 * Source node from LlamaIndex.TS
 */
export interface SourceNode {
  node: DocumentNode;
  score?: number;
}

/**
 * Document node structure
 */
export interface DocumentNode {
  metadata: DocumentMetadata;
  getContent(): string;
}

/**
 * Chat message for conversation history
 * Import LlamaIndex types for compatibility
 */
import type { ChatMessage as LlamaIndexChatMessage } from 'llamaindex';

/**
 * Use LlamaIndex's ChatMessage type for compatibility
 */
export type ChatMessage = LlamaIndexChatMessage;

/**
 * Query engine type options
 */
export type QueryEngineType = 'default' | 'router' | 'subquestion';

/**
 * Chat engine type options
 */
export type ChatEngineType = 'condense' | 'context';

/**
 * Agent type options
 */
export type AgentType = 'react' | 'openai' | null;

/**
 * LLM provider options
 */
export type LLMProvider = 'openai' | 'anthropic';

/**
 * Index statistics
 */
export interface IndexStats {
  exists: boolean;
  collectionName: string;
  count: number;
}

/**
 * Document list entry
 */
export interface DocumentListEntry {
  id: string;
  file_name: string;
  file_type: string;
  upload_date: string;
  file_url: string | null;
  stored_file_path: string | null;
  chunk_count: number;
  content: string;
  file_size: string | null;
  deleted_chunks?: number;
  error?: string;
  success?: boolean;
}

/**
 * Engine response structure
 */
export interface EngineResponse {
  message: ChatMessage;
  sourceNodes?: SourceNode[];
}

/**
 * Query execution options
 */
export interface QueryOptions {
  streaming: boolean;
  queryEngineType: QueryEngineType;
  conversationHistory: ChatMessage[];
  chatEngineType: ChatEngineType;
  agentType: AgentType;
  sessionKey: string | null;
  systemPrompt: string | null;
}

/**
 * Document processing result
 */
export interface DocumentProcessingResult {
  documents: RAGDocument[];
  chunksProcessed: number;
  filename: string;
}

/**
 * Error types for LlamaIndex operations
 */
export class LlamaIndexError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'LlamaIndexError';
  }
}

/**
 * Validation error types
 */
export class LlamaIndexValidationError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
