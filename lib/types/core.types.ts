/**
 * Core RAG Types
 * Type definitions for LlamaIndex.TS document processing, query engines, and chat engines
 * Uses LlamaIndex built-in types where available
 */

// Import LlamaIndex built-in types
import type {
  BaseNode,
  NodeWithScore,
  ChatMessage as LlamaIndexChatMessage,
  EngineResponse as LlamaIndexEngineResponse,
  VectorStoreIndex,
} from "llamaindex";

// Re-export VectorStoreIndex as IndexType for backward compatibility
export type IndexType = VectorStoreIndex;

// Chat engine return type - uses unknown for flexibility with different engine types
export type ChatEngineReturnType = unknown;

/**
 * Use LlamaIndex's ChatMessage type for compatibility
 */
export type ChatMessage = LlamaIndexChatMessage;

/**
 * Custom metadata interface with project-specific fields
 * Used as generic parameter for LlamaIndex types
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

/**
 * RAG document interface with text and custom metadata
 * This interface is compatible with how documents are created for indexing
 */
export interface RAGDocument {
  text: string;
  metadata: DocumentMetadata;
}

/**
 * Source node with score using LlamaIndex's NodeWithScore with custom metadata
 */
export type SourceNode = NodeWithScore<DocumentMetadata>;

/**
 * Document node type using LlamaIndex's BaseNode with custom metadata
 */
export type DocumentNode = BaseNode<DocumentMetadata>;

/**
 * Source information extracted from query results (application-specific for UI display)
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
 * Query response structure (application-specific with streaming support)
 */
export interface QueryResponse {
  response: string | AsyncGenerator<QueryChunk> | ReadableStream<QueryChunk>;
  sources: SourceInfo[];
  streaming: boolean;
  error?: string;
  agent?: boolean;
}

/**
 * Query chunk for streaming responses (application-specific for SSE)
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
 * Query engine type options
 */
export type QueryEngineType = "default" | "router" | "subquestion";

/**
 * Chat engine type options
 */
export type ChatEngineType = "condense" | "context";

/**
 * Agent type options
 */
export type AgentType = "react" | "openai" | null;

/**
 * LLM provider options
 */
export type LLMProvider = "openai" | "anthropic";

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

export interface ChromaDocumentSummary {
  file_name: string;
  file_type: string;
  chunk_count: number;
  upload_date: string | null;
  stored_file_path: string | null;
  first_chunk_id: string;
}

/**
 * Engine response structure - re-export LlamaIndex's EngineResponse
 */
export type EngineResponse = LlamaIndexEngineResponse;

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
  constructor(message: string, _code?: string) {
    super(message);
    this.name = "LlamaIndexError";
  }
}

/**
 * Validation error types
 */
export class LlamaIndexValidationError extends Error {
  constructor(message: string, _field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}
