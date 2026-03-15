import { Document } from "@llamaindex/core/schema";
import { VectorStoreIndex } from "llamaindex";
import { Settings } from "@llamaindex/core/global";
import type {
  SourceInfo,
  QueryResponse,
  ChatMessage,
  QueryEngineType,
  ChatEngineType,
  AgentType,
  IndexStats,
  IndexType,
  DocumentListEntry,
  RAGDocument
} from "../types";
import type { ChromaCollection, ChromaMetadata } from "../types/chromadb-compatibility";
import { getChromaClient } from "./vectorstore";
import { getQueryEngine } from "./queryengines";
import { getChatEngine, convertToChatMessages } from "./chatengines";
import { getAgent } from "./agents";
import { initializeSettings } from "./settings";
import { getSystemPrompt } from "./prompts";

// Global cache for VectorStoreIndex instances
declare global {
  var indexCache: Record<string, IndexType> | undefined;
}

if (typeof global !== "undefined" && !global.indexCache) {
  global.indexCache = {};
}

interface AddDocumentsResult {
  success: boolean;
  added: number;
  indexCreated: boolean;
}

interface DeleteDocumentResult {
  success: boolean;
  chunksDeleted?: number;
  error?: string;
}

interface ClearIndexResult {
  success: boolean;
  error?: string;
}

async function getChromaCollection(collectionName: string = "documents"): Promise<ChromaCollection> {
  const client = await getChromaClient();
  return await client.getCollection({ name: collectionName }) as unknown as ChromaCollection;
}

export async function getIndexStats(collectionName: string = "documents"): Promise<IndexStats> {
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

export async function deleteDocument(documentId: string, collectionName: string = "documents"): Promise<DeleteDocumentResult> {
  try {
    const coll = await getChromaCollection(collectionName);

    // Query for all chunks with this file_name
    // @ts-ignore - ChromaDB get() API compatibility
    const results = await coll.get();

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
      error: (error as Error).message,
    };
  }
}

export async function clearIndex(collectionName: string = "documents"): Promise<ClearIndexResult> {
  try {
    const client = await getChromaClient();

    console.log(`[clearIndex] Starting clear for collection: ${collectionName}`);

    try {
      await client.deleteCollection({ name: collectionName });
      console.log(`[clearIndex] Deleted collection: ${collectionName}`);
    } catch (e) {
      console.log(`[clearIndex] Collection didn't exist or already deleted: ${collectionName}`);
    }

    if (global.indexCache) {
      delete global.indexCache[collectionName];
      console.log(`[clearIndex] Cleared cache for: ${collectionName}`);
    }

    // Recreate empty collection with metadata
    await client.createCollection({
      name: collectionName,
      metadata: { description: "RAG Chatbot documents" },
    });
    console.log(`[clearIndex] Recreated collection: ${collectionName}`);

    return { success: true };
  } catch (error) {
    console.error("[clearIndex] Error clearing index:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

export async function addDocuments(documents: RAGDocument[], collectionName: string = "documents"): Promise<AddDocumentsResult> {
  const llamaDocuments = documents.map((doc) => {
    const text = doc.text;
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
  const index = await VectorStoreIndex.fromDocuments(llamaDocuments);

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
async function storeDocumentsInChroma(documents: Document[], collectionName: string = "documents"): Promise<void> {
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
    const ids: string[] = [];
    const metadatas: ChromaMetadata[] = [];
    const docs: string[] = [];
    const texts: string[] = [];

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
    // @ts-ignore - ChromaDB metadata type compatibility
    await collection.add({
      ids: ids,
      embeddings: embeddings,
      metadatas: metadatas as any,
      documents: docs,
    });

    console.log(`Stored ${documents.length} documents in ChromaDB`);
  } catch (error) {
    console.error("Error storing documents in ChromaDB:", error);
    // Don't throw - allow the upload to continue even if ChromaDB fails
  }
}

/**
 * Execute a query against the index
 */
export async function executeQuery(
  query: string,
  streaming: boolean = false,
  collectionName: string = "documents",
  queryEngineType: QueryEngineType = "default",
  conversationHistory: ChatMessage[] = [],
  chatEngineType: ChatEngineType | null = null,
  agentType: AgentType = null,
  sessionKey: string | null = null,
  systemPrompt: string | null = null,
): Promise<QueryResponse> {
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
        // @ts-ignore - ChromaDB get() API compatibility
        const results = await chromaCollection.get();

        if (results.documents && results.documents.length > 0) {
          // Create documents from Chroma data
          const documents = results.documents.map((text: string, i: number) => {
            const metadata = results.metadatas?.[i] || {};
            return new Document({
              text: text,
              metadata: metadata,
            });
          });

          // Create index from documents (using default vector store)
          index = await VectorStoreIndex.fromDocuments(documents);

          // Cache index
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

    // Agent Routing - HIGHEST PRIORITY
    if (agentType) {
      try {
        const agent = await getAgent(index, agentType, sessionKey, {
          systemPrompt: systemPrompt || getSystemPrompt(),
        });

        if (streaming) {
          // @ts-ignore - Agent streaming type compatibility
          const response = await (agent as any).chat({ message: query, stream: true });

          return {
            response: response,
            sources: [],
            streaming: true,
            agent: true,
          };
        }

        // @ts-ignore - Agent response type compatibility
        const response = await (agent as any).chat({ message: query });

        return {
          response: response.response || response.toString(),
          sources: [], // Agents may provide different source format
          streaming: false,
          agent: true,
        };
      } catch (agentError) {
        console.error("Agent error:", agentError);
        throw agentError;
      }
    }

    // Chat Engine Routing - prioritized over query engines when chatEngineType is provided
    if (chatEngineType) {
      const chatMessages = convertToChatMessages(conversationHistory);

      try {
        const finalSystemPrompt: string | undefined = (systemPrompt || getSystemPrompt()) || undefined;
        // @ts-ignore - TypeScript issue with null vs undefined handling
        const chatEngine = await getChatEngine(index, chatEngineType, chatMessages, sessionKey, finalSystemPrompt);

        if (streaming) {
          // @ts-ignore - Chat engine type compatibility
          const response = await (chatEngine as any).chat({ message: query, stream: true });

          return {
            response: response,
            sources: [],
            streaming: true,
          };
        }

        // @ts-ignore - Chat engine type compatibility
        const response = await (chatEngine as any).chat({ message: query });

        const sources: SourceInfo[] = [];
        if (response.sourceNodes) {
          for (const node of response.sourceNodes) {
            sources.push({
              filename: node.node.metadata?.file_name || "Unknown",
              fileType: node.node.metadata?.file_type || "Unknown",
              score: node.score ? parseFloat(node.score.toFixed(3)) : 0,
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
          errorMessage: (chatError as Error).message,
          errorStack: (chatError as Error).stack?.split('\n').slice(0, 3).join('\n'),
        });
        throw chatError;
      }
    }

    // Query Engine Routing - for backward compatibility
    // Note: Query engines in LlamaIndex.TS don't directly support system messages.
    // For explicit system prompt control, use chat engines instead (via chatEngineType parameter).
    const queryEngine = await getQueryEngine(index, queryEngineType);

    if (streaming && queryEngineType === "default") {
      // @ts-ignore - Query engine type compatibility
      const response = await (queryEngine as any).query({ query, stream: true });

      return {
        response: response,
        sources: [],
        streaming: true,
      };
    }

    // @ts-ignore - Query engine type compatibility
    const response = await (queryEngine as any).query({ query });

    const sources: SourceInfo[] = [];
    if (response.sourceNodes) {
      for (const node of response.sourceNodes) {
        sources.push({
          filename: node.node.metadata?.file_name || "Unknown",
          fileType: node.node.metadata?.file_type || "Unknown",
          score: node.score ? parseFloat(node.score.toFixed(3)) : 0,
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
      message: (error as Error).message,
      stack: (error as Error).stack?.split('\n').slice(0, 5).join('\n'),
      queryLength: query?.length,
      queryEngineType,
      chatEngineType,
      conversationHistoryLength: conversationHistory?.length,
    });
    return {
      response: "",
      sources: [],
      error: (error as Error).message,
      streaming: false,
    };
  }
}