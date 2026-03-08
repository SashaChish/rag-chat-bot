import { Document } from "@llamaindex/core/schema";
import { VectorStoreIndex } from "llamaindex";
import { Settings } from "@llamaindex/core/global";
import { getChromaClient } from "./vectorstore.js";
import { getQueryEngine } from "./queryengines.js";
import { getChatEngine, convertToChatMessages } from "./chatengines.js";
import { initializeSettings } from "./settings.js";

// Global cache for VectorStoreIndex instances
if (typeof global !== "undefined") {
  if (!global.indexCache) {
    global.indexCache = {};
  }
}

/**
 * Get the Chroma collection directly
 */
async function getChromaCollection(collectionName = "documents") {
  const client = await getChromaClient();
  return await client.getCollection({ name: collectionName });
}

/**
 * Get collection statistics
 */
export async function getIndexStats(collectionName = "documents") {
  try {
    const collection = await getChromaCollection(collectionName);
    const count = await collection.count();

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
 * Delete a document by ID (file_name)
 */
export async function deleteDocument(documentId, collectionName = "documents") {
  try {
    const coll = await getChromaCollection(collectionName);

    // Query for all chunks with this file_name
    const results = await coll.get({
      where: { file_name: documentId },
    });

    if (!results.ids || results.ids.length === 0) {
      return { success: true, chunksDeleted: 0 };
    }

    // Delete all chunks with their actual IDs
    await coll.delete({
      ids: results.ids,
    });

    // Clear the index cache so it will be rebuilt
    if (global.indexCache) {
      delete global.indexCache[collectionName];
    }

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
 * Clear all documents from collection
 */
export async function clearIndex(collectionName = "documents") {
  try {
    const client = await getChromaClient();
    try {
      await client.deleteCollection({ name: collectionName });
    } catch (e) {
      // Collection might not exist, that's fine
    }

    // Clear cache
    if (global.indexCache) {
      delete global.indexCache[collectionName];
    }

    return { success: true };
  } catch (error) {
    console.error("Error clearing index:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function addDocuments(documents, collectionName = "documents") {
  const llamaDocuments = documents.map((doc) => {
    const text = doc.text || doc.getContent();
    const metadata = doc.metadata || {};

    return new Document({
      text: text,
      metadata: {
        ...metadata,
        file_name: metadata.file_name || metadata.filename || "Unknown",
        file_type: metadata.file_type || metadata.type || "Unknown",
        upload_date: metadata.upload_date || new Date().toISOString(),
      },
    });
  });

  // Store document metadata in ChromaDB for document list functionality
  await storeDocumentsInChroma(llamaDocuments, collectionName);

  // Use default vector store (SimpleVectorStore) for in-memory indexing
  const index = await VectorStoreIndex.fromDocuments(llamaDocuments, {
    serviceContext: Settings.serviceContext,
  });

  if (global.indexCache === undefined) {
    global.indexCache = {};
  }
  global.indexCache[collectionName] = index;

  return {
    success: true,
    added: llamaDocuments.length,
    indexCreated: true,
  };
}

/**
 * Store document metadata in ChromaDB for document list
 */
async function storeDocumentsInChroma(documents, collectionName = "documents") {
  try {
    // Ensure settings are initialized
    if (!Settings.embedModel) {
      initializeSettings();
    }

    const client = await getChromaClient();
    const collection = await client.getOrCreateCollection({
      name: collectionName,
      metadata: { description: "RAG Chatbot documents" },
    });

    // Extract document data for ChromaDB
    const ids = [];
    const metadatas = [];
    const docs = [];
    const texts = [];

    for (const doc of documents) {
      const id = `${doc.metadata.file_name}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      ids.push(id);
      metadatas.push(doc.metadata);
      docs.push(doc.text);
      texts.push(doc.text);
    }

    // Generate embeddings using LlamaIndex.TS
    const embeddings = await Settings.embedModel.getTextEmbeddings(texts);

    // Add documents to ChromaDB with embeddings
    await collection.add({
      ids: ids,
      embeddings: embeddings,
      metadatas: metadatas,
      documents: docs,
    });

    console.log(`Stored ${documents.length} documents in ChromaDB`);
  } catch (error) {
    console.error("Error storing documents in ChromaDB:", error);
    // Don't throw - allow the upload to continue even if ChromaDB fails
  }
}


export async function executeQuery(
  query,
  streaming = false,
  collectionName = "documents",
  queryEngineType = "default",
  conversationHistory = [],
  chatEngineType = null,
) {


  try {
    let index = global.indexCache?.[collectionName];
    
    // If index is not in cache but documents exist, rebuild from Chroma
    if (!index) {
      const stats = await getIndexStats(collectionName);
      if (stats.count === 0) {
        // No documents - return success with helpful message (not an error)
        return {
          response:
            "I don't have any documents to search through yet. Please upload some documents first.",
          sources: [],
          streaming: false,
        };
      }
      
      // Documents exist but index not cached - need to rebuild
      try {
        // Load documents from Chroma and create index
        const chromaCollection = await getChromaCollection(collectionName);
        const results = await chromaCollection.get({ include: ['documents', 'metadatas'] });

        if (results.documents && results.documents.length > 0) {
          // Create documents from Chroma data
          const documents = results.documents.map((text, i) => {
            const metadata = results.metadatas[i] || {};
            return new Document({
              text: text,
              metadata: metadata,
            });
          });

          // Create index from documents (using default vector store)
          index = await VectorStoreIndex.fromDocuments(documents, {
            serviceContext: Settings.serviceContext,
          });

          // Cache the index
          if (global.indexCache === undefined) {
            global.indexCache = {};
          }
          global.indexCache[collectionName] = index;

          console.log(`Rebuilt index from Chroma: ${documents.length} documents`);
        } else {
          // No documents in Chroma
          return {
            response:
              "I don't have any documents to search through yet. Please upload some documents first.",
            sources: [],
            streaming: false,
          };
        }
      } catch (rebuildError) {
        console.error("Failed to rebuild index from Chroma:", rebuildError);
        return {
          response:
            "I encountered an error while trying to access your documents. Please try again.",
          sources: [],
          error: "Index not available",
          streaming: false,
        };
      }
    }

    // Chat Engine Routing - prioritized over query engines when chatEngineType is provided
    if (chatEngineType) {
      const chatMessages = convertToChatMessages(conversationHistory);

      try {
        const chatEngine = await getChatEngine(index, chatEngineType, chatMessages);

        if (streaming) {
          const response = await chatEngine.chat({ message: query, stream: true });

          return {
            response: response,
            sources: [],
            streaming: true,
          };
        }

        const response = await chatEngine.chat({ message: query });

      const sources = [];
      if (response.sourceNodes) {
        for (const node of response.sourceNodes) {
          sources.push({
            filename: node.node.metadata?.file_name || "Unknown",
            fileType: node.node.metadata?.file_type || "Unknown",
            score: node.score ? node.score.toFixed(3) : null,
            text: node.node.getContent().substring(0, 200) + "...",
            metadata: node.node.metadata,
          });
        }
      }

      return {
        response: response.response || response.toString(),
        sources: sources,
        streaming: false,
      };
    } catch (chatError) {
      console.error("Chat engine error details:", {
        chatEngineType,
        queryLength: query.length,
        conversationHistoryLength: chatMessages.length,
        errorMessage: chatError.message,
        errorStack: chatError.stack?.split('\n').slice(0, 3).join('\n'),
      });
      throw chatError;
    }
    }

    // Query Engine Routing - for backward compatibility
    const queryEngine = await getQueryEngine(index, queryEngineType);

    if (streaming && queryEngineType === "default") {
      const response = await queryEngine.query({ query, stream: true });

      return {
        response: response,
        sources: [],
        streaming: true,
      };
    }

    const response = await queryEngine.query({ query });

    const sources = [];
    if (response.sourceNodes) {
      for (const node of response.sourceNodes) {
        sources.push({
          filename: node.node.metadata?.file_name || "Unknown",
          fileType: node.node.metadata?.file_type || "Unknown",
          score: node.score ? node.score.toFixed(3) : null,
          text: node.node.getContent().substring(0, 200) + "...",
          metadata: node.node.metadata,
        });
      }
    }

    return {
      response: response.response || response.toString(),
      sources: sources,
      streaming: false,
    };
  } catch (error) {
    console.error("Error executing query:", {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      queryLength: query?.length,
      queryEngineType,
      chatEngineType,
      conversationHistoryLength: conversationHistory?.length,
    });
    return {
      response: null,
      sources: [],
      error: error.message,
      streaming: false,
    };
  }
}
