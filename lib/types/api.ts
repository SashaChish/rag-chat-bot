import { ChatMessage } from "llamaindex";
import {
  AgentType,
  ChatEngineType,
  DocumentListEntry,
  IndexStats,
  QueryEngineType,
  SourceInfo,
} from "./core.types";
import { NextRequest, NextResponse } from "next/server";

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  streaming?: boolean;
  queryEngineType?: QueryEngineType;
  chatEngineType?: ChatEngineType;
  agentType?: AgentType;
  sessionKey?: string | null;
  systemPrompt?: string | null;
}

export interface ChatResponse {
  response: string;
  sources: SourceInfo[];
}

export interface ChatStreamChunk {
  chunk?: string;
  response?: string;
  done?: boolean;
  sources?: SourceInfo[];
  error?: string;
}

export interface ChatStatusResponse {
  ready: boolean;
  message: string;
}

export interface DocumentUploadRequest {
  file: File;
}

/**
 * Document upload response
 */
export interface DocumentUploadResponse {
  success: boolean;
  id: string;
  filename: string;
  originalName: string;
  size: string;
  type: string;
  chunksProcessed: number;
  message: string;
}

export interface DocumentListResponse {
  documents: DocumentListEntry[];
}

export interface DocumentInfoResponse {
  success: boolean;
  message: string;
}

export interface SupportedFormat {
  type: string;
  extensions: string;
}

export interface DocumentsGetResponse {
  stats: IndexStats;
  supportedFormats: SupportedFormat[];
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * API endpoint handler
 */
export type APIHandler = (request: NextRequest) => Promise<NextResponse>;

export interface ValidationErrorResponse extends ErrorResponse {
  field?: string;
}

export interface SuccessResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FilterParams {
  [key: string]: unknown;
}

/**
 * Query parameters for document listing
 */
export interface DocumentListQueryParams
  extends PaginationParams, SortParams, FilterParams {
  action?: "list" | "stats" | "formats";
}

export type APIMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";

/**
 * CORS configuration
 */
export interface CORSConfig {
  origin: string | string[];
  methods: APIMethod[];
  headers: string[];
  credentials?: boolean;
  maxAge?: number;
}

/**
 * File upload configuration
 */
export interface FileUploadConfig {
  maxSize: number;
  allowedTypes: string[];
  allowedExtensions: string[];
}

/**
 * Streaming response options
 */
export interface StreamOptions {
  headers?: Record<string, string>;
  status?: number;
}

/**
 * API middleware function
 */
export type APIMiddleware = (
  request: NextRequest,
  response?: NextResponse,
) => Promise<NextResponse | void>;

/**
 * Request validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error detail
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}
