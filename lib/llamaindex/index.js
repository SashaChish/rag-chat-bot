/**
 * LlamaIndex.TS Index Manager
 * Manages document indexing and query engines using LlamaIndex.TS patterns
 * Uses ChromaDB for vector storage with LlamaIndex.TS for orchestration
 */

import { Document } from "@llamaindex/core/schema";
import { Settings } from "@llamaindex/core/global";
import { SentenceSplitter } from "@llamaindex/core/node-parser";
import {
  getCollection,
  addEmbeddings,
  queryCollection,
  hasDocuments,
  getCollectionStats,
} from "./vectorstore.js";

let embeddingModel = null;

/**
 * Get embedding model instance
 */
export function getEmbeddingModel() {
  if (!embeddingModel) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required for embeddings");
    }

    const embeddingModelName =
      process.env.EMBEDDING_MODEL || "text-embedding-3-small";

    // Use Settings.embedModel configured in settings.js
    embeddingModel = Settings.embedModel;
  }

  return embeddingModel;
}

/**
 * Create embeddings for a list of texts using LlamaIndex.TS
 */
export async function createEmbeddings(texts) {
  const model = getEmbeddingModel();

  // Use batch embedding method for better performance
  return await model.getTextEmbeddings(texts);
}

/**
 * Add documents to the index with text splitting using LlamaIndex.TS
 * Implements the spec requirement for using LlamaIndex.TS splitters
 */
export async function addDocuments(documents, collectionName = "documents") {
  const chunkSize = parseInt(process.env.CHUNK_SIZE || "1000");
  const chunkOverlap = parseInt(process.env.CHUNK_OVERLAP || "200");

  // Configure LlamaIndex.TS SentenceSplitter
  const splitter = new SentenceSplitter({
    chunkSize,
    chunkOverlap,
  });

  // Split documents into chunks using LlamaIndex.TS
  const allChunks = [];
  const allMetadatas = [];
  const allIds = [];

  for (const doc of documents) {
    const text = doc.text || doc.getContent();

    // Split the text
    const chunks = splitter.splitText(text);

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `${doc.id_ || doc.id || "doc"}-${i}-${Date.now()}`;

      allChunks.push(chunks[i]);
      allMetadatas.push({
        ...(doc.metadata || {}),
        id: chunkId,
        chunk_index: i,
      });
      allIds.push(chunkId);
    }
  }

  // Create embeddings for all chunks
  const embeddings = await createEmbeddings(allChunks);

  // Add to Chroma
  const result = await addEmbeddings(
    embeddings,
    allChunks,
    allMetadatas,
    allIds,
    collectionName,
  );

  return { success: true, added: allChunks.length, ids: allIds };
}

/**
 * Query documents and retrieve relevant chunks
 * Implements QueryEngine-like pattern using Chroma for retrieval
 */
export async function queryDocuments(
  query,
  topK = 3,
  collectionName = "documents",
) {
  try {
    // Create embedding for query
    const embedding = await createEmbeddings([query]);

    // Query Chroma
    const results = await queryCollection(embedding[0], topK, collectionName);

    // Format results
    const sources = [];
    if (results.documents && results.documents[0]) {
      for (let i = 0; i < results.documents[0].length; i++) {
        sources.push({
          text: results.documents[0][i],
          metadata: results.metadatas[0][i] || {},
          id: results.ids[0][i],
          score: results.distances ? 1 - results.distances[0][i] : null, // Convert distance to similarity
        });
      }
    }

    return sources;
  } catch (error) {
    console.error("Error querying documents:", error);
    return [];
  }
}

/**
 * Execute a RAG query using LLM and retrieved documents
 * Implements QueryEngine pattern with streaming support
 */
export async function executeQuery(
  query,
  streaming = false,
  collectionName = "documents",
) {
  // Check if documents exist
  const docsExist = await hasDocuments(collectionName);
  if (!docsExist) {
    return {
      response:
        "I don't have any documents to search through yet. Please upload some documents first.",
      sources: [],
      error: "No documents indexed",
      streaming: false,
    };
  }

  try {
    // Get top-k from environment
    const topK = parseInt(process.env.TOP_K_RESULTS || "3");

    // Retrieve relevant documents
    const sources = await queryDocuments(query, topK, collectionName);

    if (sources.length === 0) {
      return {
        response:
          "I couldn't find any relevant information in your documents to answer your question. Could you rephrase or ask about something else?",
        sources: [],
        streaming: false,
      };
    }

    // Build context from retrieved documents with file names
    const context = sources
      .map((source, i) => `[${source.metadata.file_name || "Document " + (i + 1)}]: ${source.text}`)
      .join("\n\n");

    // Get LLM from Settings
    const llm = Settings.llm;
    if (!llm) {
      throw new Error(
        "LLM not configured. Please set OPENAI_API_KEY in environment variables.",
      );
    }

    // Build prompt with context
    const prompt = `You are a helpful assistant that answers questions based on the provided context from uploaded documents.

Context from documents:
${context}

Question: ${query}

Instructions:
1. Use only the information provided in the context above
2. If the context doesn't contain relevant information, acknowledge this and provide a general response based on your knowledge
3. Be concise and accurate
4. Cite the documents you used in your answer`;

    // Generate response with or without streaming
    if (streaming) {
      // Streaming response
      const response = await llm.chat({
        messages: [{ role: "user", content: prompt }],
        stream: true,
      });

      return {
        response,
        sources: sources.map((source) => ({
          filename: source.metadata.file_name || "Unknown",
          fileType: source.metadata.file_type || "Unknown",
          score: source.score ? source.score.toFixed(3) : null,
          text: source.text.substring(0, 200) + "...",
          metadata: source.metadata,
        })),
        streaming: true,
      };
    } else {
      // Non-streaming response
      const response = await llm.chat({
        messages: [{ role: "user", content: prompt }],
      });

      return {
        response: response.message.content,
        sources: sources.map((source) => ({
          filename: source.metadata.file_name || "Unknown",
          fileType: source.metadata.file_type || "Unknown",
          score: source.score ? source.score.toFixed(3) : null,
          text: source.text.substring(0, 200) + "...",
          metadata: source.metadata,
        })),
        streaming: false,
      };
    }
  } catch (error) {
    console.error("Error executing query:", error);
    return {
      response: null,
      sources: [],
      error: error.message,
      streaming: false,
    };
  }
}

/**
 * Get index statistics
 */
export async function getIndexStats(collectionName = "documents") {
  const stats = await getCollectionStats(collectionName);
  return stats;
}

/**
 * Delete a document from index
 */
export async function deleteDocument(documentId, collectionName = "documents") {
  try {
    // Delete from Chroma
    const result = await import("./vectorstore.js").then((m) =>
      m.deleteDocument(documentId, collectionName),
    );

    return result;
  } catch (error) {
    console.error("Error deleting document:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Clear all documents from index
 */
export async function clearIndex(collectionName = "documents") {
  try {
    const result = await import("./vectorstore.js").then((m) =>
      m.clearCollection(collectionName),
    );

    return result;
  } catch (error) {
    console.error("Error clearing index:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get global index instance (placeholder for compatibility)
 */
export function getGlobalIndex() {
  return null;
}

/**
 * Set global index instance (placeholder for compatibility)
 */
export function setGlobalIndex(index) {
  // No-op for ChromaDB integration
}

/**
 * Generate a unique document ID
 */
export function generateDocumentId(filename) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${filename}-${timestamp}-${random}`;
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
