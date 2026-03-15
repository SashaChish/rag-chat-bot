/**
 * ChromaDB Integration Types
 * Type definitions for ChromaDB vector store operations
 */

/**
 * ChromaDB collection metadata
 */
export interface ChromaCollectionMetadata {
  name: string;
  id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * ChromaDB document result
 */
export interface ChromaDocument {
  ids: string[];
  embeddings?: number[][];
  metadatas?: Record<string, unknown>[];
  documents?: string[];
  uris?: string[];
  data?: Record<string, unknown>;
}

/**
 * ChromaDB query result
 */
export interface ChromaQueryResult {
  ids: string[][];
  embeddings?: number[][];
  documents?: string[][];
  metadatas?: Record<string, unknown>[][];
  distances?: number[][];
  uris?: string[][];
  data?: Record<string, unknown>;
}

/**
 * ChromaDB client configuration
 */
export interface ChromaClientConfig {
  path?: string;
  host?: string;
  port?: number;
}

/**
 * ChromaDB get options
 */
export interface ChromaGetOptions {
  ids?: string[];
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  include?: ('metadatas' | 'documents' | 'embeddings')[];
}

/**
 * ChromaDB query options
 */
export interface ChromaQueryOptions {
  queryTexts?: string[];
  queryEmbeddings?: number[][];
  nResults?: number;
  where?: Record<string, unknown>;
  whereDocument?: Record<string, unknown>;
  include?: ('metadatas' | 'documents' | 'distances' | 'embeddings')[];
}

/**
 * ChromaDB collection options
 */
export interface ChromaCollectionOptions {
  name: string;
  metadata?: Record<string, unknown>;
  embeddingFunction?: unknown;
}

/**
 * ChromaDB delete options
 */
export interface ChromaDeleteOptions {
  ids?: string[];
  where?: Record<string, unknown>;
  whereDocument?: Record<string, unknown>;
}

/**
 * ChromaDB add options
 */
export interface ChromaAddOptions {
  ids: string[];
  embeddings?: number[][];
  metadatas?: Record<string, unknown>[];
  documents?: string[];
  uris?: string[];
}

/**
 * ChromaDB update options
 */
export interface ChromaUpdateOptions {
  ids: string[];
  embeddings?: number[][];
  metadatas?: Record<string, unknown>[];
  documents?: string[];
  uris?: string[];
}

/**
 * ChromaDB upsert options
 */
export interface ChromaUpsertOptions {
  ids: string[];
  embeddings?: number[][];
  metadatas?: Record<string, unknown>[];
  documents?: string[];
  uris?: string[];
}

/**
 * ChromaDB collection statistics
 */
export interface ChromaCollectionStats {
  name: string;
  count: number;
  metadata?: Record<string, unknown>;
}

/**
 * ChromaDB error types
 */
export class ChromaDBError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'ChromaDBError';
  }
}