/**
 * Vector Store Manager
 * Manages Chroma connection using chromadb package
 * Provides compatibility layer for LlamaIndex.TS integration
 */

import { ChromaClient } from "chromadb";
import { setVectorStore } from "./index.js";
import fs from "fs";
import path from "path";

let chromaClient = null;
let initialized = false;

/**
 * Initialize Chroma vector store with local SQLite backend
 * Note: In chromadb v3.x, local persistence requires running a ChromaDB server
 */
export async function initChroma() {
  if (initialized && chromaClient) {
    return chromaClient;
  }

  const chromaHost = process.env.CHROMA_HOST || "localhost";
  const chromaPort = parseInt(process.env.CHROMA_PORT || "8000");

  try {
    // Initialize Chroma client connecting to local server
    chromaClient = new ChromaClient({
      host: chromaHost,
      port: chromaPort,
    });

    // Test connection by listing collections
    await chromaClient.listCollections();

    initialized = true;
    console.log(`Chroma initialized connecting to http://${chromaHost}:${chromaPort}`);
    return chromaClient;
  } catch (error) {
    console.error("Failed to initialize Chroma:", error);
    console.warn("\n" + "=".repeat(60));
    console.warn("ChromaDB server not found!");
    console.warn("Please run: docker run -p 8000:8000 chromadb/chroma");
    console.warn("Or install locally: https://docs.trychroma.com/deployment/local");
    console.warn("=".repeat(60));

    // Fallback to in-memory Chroma instance (data won't persist)
    console.warn("Falling back to in-memory Chroma (data will not persist after restart)");
    chromaClient = new ChromaClient();

    initialized = true;
    return chromaClient;
  }
}

/**
 * Get the Chroma client instance
 * Note: For full LlamaIndex.TS vector store compatibility,
 * the index manager uses Chroma through a custom wrapper
 */
export async function getVectorStore() {
  if (!initialized) {
    await initChroma();
  }
  return chromaClient;
}

/**
 * Get Chroma client instance
 */
export async function getChromaClient() {
  return await getVectorStore();
}

/**
 * Get or create a collection for documents
 */
export async function getCollection(collectionName = "documents") {
  const client = await getChromaClient();

  try {
    // Try to get existing collection
    const collection = await client.getOrCreateCollection({
      name: collectionName,
      metadata: { description: "RAG Chatbot documents" },
    });

    return collection;
  } catch (error) {
    console.error("Error getting collection:", error);
    throw error;
  }
}

/**
 * Add embeddings to collection (legacy, for compatibility)
 * Note: New code should use addDocuments() from index.js
 */
export async function addEmbeddings(embeddings, documents, metadatas, ids, collectionName = "documents") {
  const coll = await getCollection(collectionName);

  await coll.add({
    embeddings,
    documents,
    metadatas,
    ids,
  });

  return { success: true, added: ids.length };
}

/**
 * Query collection (legacy, for compatibility)
 * Note: New code should use queryDocuments() from index.js with QueryEngine
 */
export async function queryCollection(queryEmbedding, topK = 3, collectionName = "documents") {
  const coll = await getCollection(collectionName);

  const results = await coll.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
  });

  return results;
}

/**
 * Check if collection has any documents
 */
export async function hasDocuments(collectionName = "documents") {
  try {
    const client = await getChromaClient();
    const coll = await client.getCollection({ name: collectionName });
    const count = await coll.count();

    return count > 0;
  } catch (error) {
    console.error("Error checking for documents:", error);
    return false;
  }
}

/**
 * Clear all documents from collection
 */
export async function clearCollection(collectionName = "documents") {
  try {
    const client = await getChromaClient();

    // Delete collection and recreate it
    try {
      await client.deleteCollection({ name: collectionName });
    } catch (e) {
      // Collection might not exist, that's fine
    }

    // Recreate empty collection
    await client.createCollection({
      name: collectionName,
      metadata: { description: "RAG Chatbot documents" },
    });

    return { success: true };
  } catch (error) {
    console.error("Error clearing collection:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete a document by ID
 */
export async function deleteDocument(id, collectionName = "documents") {
  try {
    const coll = await getCollection(collectionName);

    await coll.delete({
      ids: [id],
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting document:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get collection statistics
 */
export async function getCollectionStats(collectionName = "documents") {
  try {
    const client = await getChromaClient();
    const coll = await client.getCollection({ name: collectionName });
    const count = await coll.count();

    return {
      exists: true,
      collectionName,
      count,
    };
  } catch (error) {
    return {
      exists: false,
      collectionName,
      count: 0,
    };
  }
}
