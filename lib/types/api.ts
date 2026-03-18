import type { ChatMessage } from "llamaindex";
import type {
  ChatEngineType,
  DocumentListEntry,
  IndexStats,
  SourceInfo,
} from "./core.types";

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  streaming?: boolean;
  chatEngineType?: ChatEngineType;
  sessionKey?: string | null;
  systemPrompt?: string | null;
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

export interface SupportedFormat {
  type: string;
  extensions: string;
}

export interface DocumentsGetResponse {
  stats: IndexStats;
  supportedFormats: SupportedFormat[];
}
