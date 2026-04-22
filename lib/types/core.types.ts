/**
 * Core RAG Types
 * Type definitions for LlamaIndex.TS document processing, query engines, and chat engines
 * Uses LlamaIndex built-in types where available
 */

// Import LlamaIndex built-in types
import type {
  NodeWithScore,
  ChatMessage as LlamaIndexChatMessage,
  CondenseQuestionChatEngine,
  ContextChatEngine,
} from "llamaindex";

// Chat engine return type - union of supported chat engine types
export type ChatEngineReturnType =
  | CondenseQuestionChatEngine
  | ContextChatEngine;

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
  original_file_base64?: string;
  can_download?: boolean;
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

export type SourceNode = NodeWithScore<DocumentMetadata>;

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
 * @deprecated Use ChatEngineType instead - chat engines provide all query engine functionality plus conversation history
 */
export type QueryEngineType = "default" | "router" | "subquestion";

/**
 * Chat engine type options
 */
export type ChatEngineType = "condense" | "context";

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
  documentCount: number;
}

/**
 * Document list entry
 */
export interface DocumentListEntry {
  id: string;
  file_name: string;
  file_type: string;
  upload_date: string;
  chunk_count: number;
  content: string;
  file_size: string | null;
  can_download: boolean;
  deleted_chunks?: number;
  error?: string;
  success?: boolean;
}

export interface ChromaDocumentSummary {
  file_name: string;
  file_type: string;
  chunk_count: number;
  upload_date: string | null;
  first_chunk_id: string;
}
