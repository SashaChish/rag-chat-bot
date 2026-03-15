/**
 * Shared Types
 * Types used across multiple domains in the RAG chatbot project
 */

/**
 * Generic result wrapper
 */
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}



/**
 * Search parameters
 */
export interface SearchParams {
  query?: string;
  filters?: { [key: string]: unknown };
  pagination?: {
    page?: number;
    limit?: number;
    offset?: number;
  };
  sort?: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

/**
 * File metadata
 */
export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  extension: string;
}

/**
 * Processing status
 */
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Processing result
 */
export interface ProcessingResult {
  status: ProcessingStatus;
  message?: string;
  timestamp: string;
  duration?: number;
}



/**
 * Configuration option
 */
export interface ConfigOption<T = unknown> {
  key: string;
  value: T;
  label?: string;
  description?: string;
}


