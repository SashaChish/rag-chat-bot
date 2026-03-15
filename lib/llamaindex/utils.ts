import { initializeSettings } from "./settings";
import type { SourceInfo, DocumentMetadata, RAGDocument } from "../types";

export function initializeLlamaIndex(): boolean {
  try {
    initializeSettings();
    console.log("LlamaIndex.TS settings initialized");
    return true;
  } catch (error) {
    console.error("Failed to initialize LlamaIndex.TS:", error);
    throw error;
  }
}

export function validateQuery(query: string): boolean {
  // Check if query is empty or whitespace only
  if (!query || query.trim().length === 0) {
    throw new Error("Query cannot be empty");
  }

  const trimmed = query.trim();

  if (trimmed.length < 5) {
    throw new Error("Query must be at least 5 characters long");
  }

  // Check maximum length
  if (trimmed.length > 1000) {
    throw new Error("Query must be less than 1000 characters");
  }

  return true;
}

export function sanitizeInput(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .replace(/[<>]/g, "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim();
}

export function formatSources(sources: SourceInfo[]): SourceInfo[] {
  if (!sources || sources.length === 0) {
    return [];
  }

  const uniqueSources: SourceInfo[] = [];
  const seenFilenames = new Set<string>();

  for (const source of sources) {
    if (!seenFilenames.has(source.filename)) {
      uniqueSources.push({
        filename: source.filename,
        fileType: source.fileType,
        score: source.score,
        text: source.text,
        preview: source.preview || source.text,
      });
      seenFilenames.add(source.filename);
    }
  }

  return uniqueSources.sort((a, b) => b.score - a.score);
}

export function generateDocumentId(filename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${filename}-${timestamp}-${random}`;
}

export function formatError(error: unknown): string {
  if (!error) {
    return "An unknown error occurred";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "toString" in error) {
    return String(error);
  }

  return "An unknown error occurred";
}

export function chunkText(text: string, maxLength: number = 200): string {
  if (!text || text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + "...";
}

export function extractDocumentMetadata(document: RAGDocument): Partial<DocumentMetadata> {
  if (!document || !document.metadata) {
    return {};
  }

  const { metadata } = document;
  const allowedFields: (keyof DocumentMetadata)[] = [
    "file_name",
    "file_path",
    "file_type",
    "upload_date",
    "page_label",
    "title",
    "author",
  ];

  const result: Partial<DocumentMetadata> = {};
  for (const field of allowedFields) {
    if (metadata[field] !== undefined) {
      result[field] = metadata[field];
    }
  }

  return result;
}

export function getChunkSize(): number {
  return parseInt(process.env.CHUNK_SIZE || "1000", 10);
}

export function getChunkOverlap(): number {
  return parseInt(process.env.CHUNK_OVERLAP || "200", 10);
}

export function getTopK(): number {
  return parseInt(process.env.TOP_K_RESULTS || "3", 10);
}

export function getMaxFileSize(): number {
  return parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10);
}

export function getContextWindow(): number {
  return parseInt(process.env.CONTEXT_WINDOW || "128000", 10);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}