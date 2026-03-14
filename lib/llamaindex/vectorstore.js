/**
 * Vector Store Manager
 * Manages Chroma connection using chromadb package
 * Provides compatibility layer for LlamaIndex.TS integration
 */

import { ChromaClient } from "chromadb";

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
 * Delete a document by ID (file_name)
 * Deletes all chunks associated with the document
 */
export async function deleteDocument(id, collectionName = "documents") {
  try {
    const coll = await getCollection(collectionName);

    // Query for all chunks with this file_name
    const results = await coll.get({
      where: { file_name: id },
    });

    if (!results.ids || results.ids.length === 0) {
      return { success: true, chunksDeleted: 0 };
    }

    // Delete all chunks with their actual IDs
    await coll.delete({
      ids: results.ids,
    });

    return { success: true, chunksDeleted: results.ids.length };
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

/**
 * Get all unique documents stored in ChromaDB
 * Returns a list of documents with their file names, chunk counts, and metadata
 */
export async function getAllDocuments() {
  try {
    const coll = await getCollection();

    // Get all documents from ChromaDB
    const results = await coll.get();

    if (!results || !results.metadatas || results.metadatas.length === 0) {
      return { documents: [], total_chunks: 0 };
    }

    // Group by file_name to get unique documents
    const documents = {};
    results.metadatas.forEach((metadata) => {
      const fileName = metadata.file_name || "unknown";

      if (!documents[fileName]) {
        documents[fileName] = {
          file_name: fileName,
          file_type: metadata.file_type || "unknown",
          chunk_count: 0,
          upload_date: metadata.upload_date || null,
          stored_file_path: metadata.stored_file_path || null,
          first_chunk_id: results.ids[results.metadatas.indexOf(metadata)],
        };
      }

      documents[fileName].chunk_count++;
    });

    // Convert to array
    const documentList = Object.values(documents).sort((a, b) => {
      // Sort by upload date descending, then by file name
      const dateA = a.upload_date ? new Date(a.upload_date).getTime() : 0;
      const dateB = b.upload_date ? new Date(b.upload_date).getTime() : 0;
      return dateB - dateA || a.file_name.localeCompare(b.file_name);
    });

    return {
      documents: documentList,
      total_chunks: results.metadatas.length,
    };
  } catch (error) {
    console.error("Error getting all documents:", error);
    throw new Error(`Failed to retrieve documents: ${error.message}`);
  }
}

/**
 * Delete a specific document (all its chunks) from ChromaDB
 * Does not touch the file system or index cache
 * @param {string} fileName - Name of the document to delete
 * @returns {Promise<number>} Number of chunks deleted
 */
export async function deleteDocumentByName(fileName) {
  try {
    const coll = await getCollection();

    // Query for all chunks with this file_name
    const results = await coll.get({
      where: { file_name: fileName },
    });

    if (!results || !results.ids || results.ids.length === 0) {
      return 0;
    }

    // Delete all chunks with their actual IDs
    await coll.delete({ ids: results.ids });

    return results.ids.length;
  } catch (error) {
    console.error(`Error deleting document ${fileName}:`, error);
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}
