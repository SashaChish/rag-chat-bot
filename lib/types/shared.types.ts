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
    sortOrder?: "asc" | "desc";
  };
}
