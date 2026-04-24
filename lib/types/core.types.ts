export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

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

export interface RAGDocument {
  text: string;
  metadata: DocumentMetadata;
}

export interface SourceInfo {
  filename: string;
  fileType: string;
  score: number;
  text?: string;
  preview?: string;
  metadata?: DocumentMetadata;
}

export interface QueryResponse {
  response: string | AsyncGenerator<QueryChunk>;
  sources: SourceInfo[];
  streaming: boolean;
  error?: string;
}

export interface QueryChunk {
  delta?: string;
  done?: boolean;
  sources?: SourceInfo[];
}

export type LLMProvider = "openai" | "anthropic" | "groq" | "ollama";

export interface IndexStats {
  exists: boolean;
  collectionName: string;
  count: number;
  documentCount: number;
}

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
