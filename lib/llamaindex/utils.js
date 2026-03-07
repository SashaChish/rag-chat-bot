/**
 * Utility functions for LlamaIndex.TS integration
 */

import { initializeSettings } from "./settings.js";

/**
 * Initialize LlamaIndex.TS settings
 * Call this once on application startup
 */
export function initializeLlamaIndex() {
  try {
    initializeSettings();
    console.log("LlamaIndex.TS settings initialized");
    return true;
  } catch (error) {
    console.error("Failed to initialize LlamaIndex.TS:", error);
    throw error;
  }
}

/**
 * Validate a user query
 */
export function validateQuery(query) {
  // Check if query is empty or whitespace only
  if (!query || query.trim().length === 0) {
    throw new Error("Query cannot be empty");
  }

  const trimmed = query.trim();

  // Check minimum length
  if (trimmed.length < 5) {
    throw new Error("Query must be at least 5 characters long");
  }

  // Check maximum length
  if (trimmed.length > 1000) {
    throw new Error("Query must be less than 1000 characters");
  }

  return true;
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input) {
  if (typeof input !== "string") {
    return "";
  }

  // Basic sanitization - remove potentially harmful characters
  return input
    .replace(/[<>]/g, "") // Remove HTML tags
    .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
    .trim();
}

/**
 * Format sources for display
 */
export function formatSources(sources) {
  if (!sources || sources.length === 0) {
    return [];
  }

  // Remove duplicates by filename
  const uniqueSources = [];
  const seenFilenames = new Set();

  for (const source of sources) {
    if (!seenFilenames.has(source.filename)) {
      uniqueSources.push({
        filename: source.filename,
        fileType: source.fileType,
        score: source.score.toFixed(3),
        preview: source.text,
      });
      seenFilenames.add(source.filename);
    }
  }

  // Sort by score (highest first)
  return uniqueSources.sort((a, b) => b.score - a.score);
}

/**
 * Generate a unique document ID
 */
export function generateDocumentId(filename) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${filename}-${timestamp}-${random}`;
}

/**
 * Format error message for display
 */
export function formatError(error) {
  if (!error) {
    return "An unknown error occurred";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  if (error.toString) {
    return error.toString();
  }

  return "An unknown error occurred";
}

/**
 * Chunk text for display (e.g., in source previews)
 */
export function chunkText(text, maxLength = 200) {
  if (!text || text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + "...";
}

/**
 * Extract metadata from document
 */
export function extractDocumentMetadata(document) {
  if (!document || !document.metadata) {
    return {};
  }

  const { metadata } = document;
  const allowedFields = [
    "file_name",
    "file_path",
    "file_type",
    "upload_date",
    "page_label",
    "title",
    "author",
  ];

  const result = {};
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
export function getChunkSize() {
  return parseInt(process.env.CHUNK_SIZE || "1000");
}

/**
 * Get chunk overlap from environment
 */
export function getChunkOverlap() {
  return parseInt(process.env.CHUNK_OVERLAP || "200");
}

/**
 * Get top-k results from environment
 */
export function getTopK() {
  return parseInt(process.env.TOP_K_RESULTS || "3");
}

/**
 * Get max file size from environment
 */
export function getMaxFileSize() {
  return parseInt(process.env.MAX_FILE_SIZE_MB || "10");
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Get system prompt for the chatbot
 */
export function getSystemPrompt() {
  return `You are a helpful assistant that answers questions based on the provided context from uploaded documents.

When answering:
1. Use only the information provided in the context
2. If the context doesn't contain relevant information, acknowledge this and provide a general response based on your knowledge
3. Be concise and accurate
4. Cite your sources by referencing the documents you used
5. If you're uncertain about something, say so rather than making up information`;
}

/**
 * Check if the system has documents indexed
 */
export async function hasDocuments() {
  try {
    const { getIndexStats } = await import("./index.js");
    const stats = await getIndexStats();
    return stats.exists;
  } catch (error) {
    return false;
  }
}
