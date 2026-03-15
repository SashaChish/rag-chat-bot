/**
 * ChromaDB Compatibility Types
 * Type definitions for ChromaDB integration with LlamaIndex.TS
 */

import type { Document } from "llamaindex";

/**
 * ChromaDB collection type
 * Represents a ChromaDB collection interface
 */
export interface ChromaCollection {
  get(): Promise<ChromaGetResult>;
  query(params: ChromaQueryParams): Promise<ChromaQueryResult>;
  add(params: ChromaAddParams): Promise<void>;
  delete(params: ChromaDeleteParams): Promise<void>;
  count(): Promise<number>;
  modify(params: ChromaModifyParams): Promise<void>;
}

/**
 * ChromaDB metadata type
 * Uses Record<string, unknown> for flexibility while requiring type narrowing
 */
export type ChromaMetadata = Record<string, unknown>;

/**
 * ChromaDB query result
 */
export interface ChromaQueryResult {
  ids: string[][];
  embeddings: number[][][];
  documents: string[][];
  metadatas: ChromaMetadata[][];
  distances: number[][];
}

/**
 * ChromaDB get result
 */
export interface ChromaGetResult {
  ids: string[];
  embeddings: number[][] | null;
  documents: string[] | null;
  metadatas: ChromaMetadata[] | null;
}

/**
 * ChromaDB query parameters
 */
export interface ChromaQueryParams {
  queryEmbeddings?: number[][];
  nResults?: number;
  where?: ChromaMetadata;
  whereDocument?: Record<string, unknown>;
}

/**
 * ChromaDB add parameters
 */
export interface ChromaAddParams {
  ids: string[];
  embeddings?: number[][];
  documents?: string[];
  metadatas?: ChromaMetadata[];
}

/**
 * ChromaDB delete parameters
 */
export interface ChromaDeleteParams {
  ids?: string[];
  where?: ChromaMetadata;
  whereDocument?: Record<string, unknown>;
}

/**
 * ChromaDB modify parameters
 */
export interface ChromaModifyParams {
  ids?: string[];
  embeddings?: number[][];
  metadatas?: ChromaMetadata[];
  documents?: string[];
}

/**
 * ChromaDB client interface
 */
export interface ChromaClient {
  getOrCreateCollection(params: { name: string }): ChromaCollection;
  listCollections(): Promise<CollectionInfo[]>;
  deleteCollection(params: { name: string }): Promise<void>;
}

/**
 * Collection information
 */
export interface CollectionInfo {
  name: string;
  id?: string;
  metadata?: ChromaMetadata;
}
