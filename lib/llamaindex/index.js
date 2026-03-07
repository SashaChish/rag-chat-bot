import { Document } from "@llamaindex/core/schema";
import { VectorStoreIndex } from "llamaindex";
import { Settings } from "@llamaindex/core/global";
import {
  getCollection,
  getCollectionStats,
  deleteDocument as deleteDocumentFromStore,
  clearCollection,
} from "./vectorstore.js";
import { getQueryEngine } from "./queryengines.js";
import { getChatEngine, convertToChatMessages } from "./chatengines.js";

// Global cache for VectorStoreIndex instances
if (typeof global !== "undefined") {
  if (!global.indexCache) {
    global.indexCache = {};
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
        const collection = await getCollection(collectionName);
        const results = await collection.get({ include: ['documents', 'metadatas'] });
        
        if (results.documents && results.documents.length > 0) {
          // Create documents from Chroma data
          const documents = results.documents.map((text, i) => {
            const metadata = results.metadatas[i] || {};
            return new Document({
              text: text,
              metadata: metadata,
            });
          });
          
          // Create index from documents
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

export async function getIndexStats(collectionName = "documents") {
  const stats = await getCollectionStats(collectionName);
  return stats;
}

export async function deleteDocument(documentId, collectionName = "documents") {
  try {
    const result = await deleteDocumentFromStore(documentId, collectionName);
    return result;
  } catch (error) {
    console.error("Error deleting document:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function clearIndex(collectionName = "documents") {
  try {
    const result = await clearCollection(collectionName);
    return result;
  } catch (error) {
    console.error("Error clearing index:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}


