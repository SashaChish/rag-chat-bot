import type { DocumentEntry } from "../db/types";
import type { ChatMessage, IndexStats, SourceInfo } from "./core.types";

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  streaming?: boolean;
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
  document: Omit<DocumentEntry, "fileSize"> & { fileSize: string };
  message: string;
}

export interface GetDocumentsResponse {
  documents: DocumentEntry[];
  stats: IndexStats;
}
