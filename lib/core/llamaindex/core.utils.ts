/**
 * LlamaIndex.TS Core Utilities
 * Utility functions specific to LlamaIndex.TS operations
 */

import { initializeSettings } from '../../llamaindex/settings';
import type { DocumentMetadata, RAGDocument } from '../../types/core.types';

/**
 * Initialize LlamaIndex.TS settings
 */
export function initializeLlamaIndex(): boolean {
  try {
    initializeSettings();
    console.log('LlamaIndex.TS settings initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize LlamaIndex.TS:', error);
    throw error;
  }
}

/**
 * Generate document ID from filename
 */
export function generateDocumentId(filename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${filename}-${timestamp}-${random}`;
}

/**
 * Format error message
 */
export function formatError(error: unknown): string {
  if (!error) {
    return 'An unknown error occurred';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'toString' in error) {
    return String(error);
  }

  return 'An unknown error occurred';
}

/**
 * Extract document metadata
 */
export function extractDocumentMetadata(document: RAGDocument): Partial<DocumentMetadata> {
  if (!document || !document.metadata) {
    return {};
  }

  const { metadata } = document;
  const allowedFields: (keyof DocumentMetadata)[] = [
    'file_name',
    'file_path',
    'file_type',
    'upload_date',
    'page_label',
    'title',
    'author',
  ];

  const result: Partial<DocumentMetadata> = {};
  for (const field of allowedFields) {
    if (metadata[field] !== undefined) {
      result[field] = metadata[field];
    }
  }

  return result;
}

/**
 * Get chunk size from environment
 */
export function getChunkSize(): number {
  return parseInt(process.env.CHUNK_SIZE || '1000', 10);
}

/**
 * Get chunk overlap from environment
 */
export function getChunkOverlap(): number {
  return parseInt(process.env.CHUNK_OVERLAP || '200', 10);
}

/**
 * Get top-k results from environment
 */
export function getTopK(): number {
  return parseInt(process.env.TOP_K_RESULTS || '3', 10);
}

/**
 * Get max file size from environment
 */
export function getMaxFileSize(): number {
  return parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10);
}

/**
 * Get context window from environment
 */
export function getContextWindow(): number {
  return parseInt(process.env.CONTEXT_WINDOW || '128000', 10);
}

/**
 * Get query engine type from environment
 */
export function getQueryEngineType(): 'default' | 'router' | 'subquestion' {
  return (process.env.QUERY_ENGINE_TYPE as 'default' | 'router' | 'subquestion') || 'default';
}

/**
 * Get chat engine type from environment
 */
export function getChatEngineType(): 'condense' | 'context' {
  return (process.env.CHAT_ENGINE_TYPE as 'condense' | 'context') || 'condense';
}

/**
 * Get LLM provider from environment
 */
export function getLLMProvider(): 'openai' | 'anthropic' {
  return (process.env.LLM_PROVIDER as 'openai' | 'anthropic') || 'openai';
}

/**
 * Get LLM model from environment
 */
export function getLLMModel(): string {
  return process.env.LLM_MODEL || 'gpt-4o-mini';
}

/**
 * Get embedding model from environment
 */
export function getEmbeddingModel(): string {
  return process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
}
