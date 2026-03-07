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
) {


  try {
    const index = global.indexCache?.[collectionName];
    if (!index) {
      const stats = await getIndexStats(collectionName);
      if (stats.count === 0) {
        return {
          response:
            "I don't have any documents to search through yet. Please upload some documents first.",
          sources: [],
          error: "No documents indexed",
          streaming: false,
        };
      }
      return {
        response:
          "I encountered an error while trying to access your documents. Please try again.",
        sources: [],
        error: "Index not available",
        streaming: false,
      };
    }

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
    console.error("Error executing query:", error);
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


