import { Document } from "@llamaindex/core/schema";
import {
  VectorStoreIndex,
  CondenseQuestionChatEngine,
  ContextChatEngine,
  MetadataMode,
} from "llamaindex";
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
  RAGDocument,
  SourceNode,
  QueryChunk,
  DocumentMetadata,
} from "../types/core.types";
import type { Collection, Metadata } from "chromadb";
import { getChromaClient } from "./vectorstore";
import { getQueryEngine } from "./queryengines";
import { getChatEngine, convertToChatMessages } from "./chatengines";
import { getAgent } from "./agents";
import { initializeSettings } from "./settings";
import { getSystemPrompt } from "./prompts";

// Global cache for VectorStoreIndex instances
declare global {
  // eslint-disable-next-line no-var
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

async function getChromaCollection(
  collectionName: string = "documents",
): Promise<Collection> {
  const client = await getChromaClient();
  return (await client.getCollection({
    name: collectionName,
  })) as Collection;
}

export async function getIndexStats(
  collectionName: string = "documents",
): Promise<IndexStats> {
  try {
    const collection = await getChromaCollection(collectionName);
    const count = await collection.count();

    return {
      exists: true,
      collectionName,
      count,
    };
  } catch (_error) {
    return {
      exists: false,
      collectionName,
      count: 0,
    };
  }
}

export async function deleteDocument(
  _documentId: string,
  collectionName: string = "documents",
): Promise<DeleteDocumentResult> {
  try {
    const coll = await getChromaCollection(collectionName);

    // Query for all chunks with this file_name
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

export async function clearIndex(
  collectionName: string = "documents",
): Promise<ClearIndexResult> {
  try {
    const client = await getChromaClient();

    console.log(
      `[clearIndex] Starting clear for collection: ${collectionName}`,
    );

    try {
      await client.deleteCollection({ name: collectionName });
      console.log(`[clearIndex] Deleted collection: ${collectionName}`);
    } catch (_e) {
      console.log(
        `[clearIndex] Collection didn't exist or already deleted: ${collectionName}`,
      );
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

export async function addDocuments(
  documents: RAGDocument[],
  collectionName: string = "documents",
): Promise<AddDocumentsResult> {
  const llamaDocuments = documents.map(({ text, metadata }) => {
    const fileName = metadata.file_name || metadata.filename || "Unknown";
    const fileType = metadata.file_type || metadata.type || "Unknown";
    const uploadDate = metadata.upload_date || new Date().toISOString();

    return new Document({
      text,
      metadata: {
        ...metadata,
        file_name: fileName,
        file_type: fileType,
        upload_date: uploadDate,
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
async function storeDocumentsInChroma(
  documents: Document[],
  collectionName: string = "documents",
): Promise<void> {
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
    const metadatas: Metadata[] = [];
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
    const addParams = {
      ids,
      embeddings,
      metadatas,
      documents: docs,
    };
    await (collection as Collection).add(addParams);

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
        const results = await chromaCollection.get();

        if (results.documents && results.documents.length > 0) {
          const documents = results.documents
            .filter((text: string | null): text is string => text !== null)
            .map((text: string, i: number) => {
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

          console.log(
            `Rebuilt index from Chroma: ${documents.length} documents`,
          );
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
          systemPrompt,
        });

        if (streaming) {
          const response = (await agent.chat({
            message: query,
            stream: true,
          })) as ReadableStream<QueryChunk>;

          return {
            response: response,
            sources: [],
            streaming: true,
            agent: true,
          };
        }

        const response = await agent.chat({ message: query });

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
        const finalSystemPrompt: string | undefined =
          systemPrompt || getSystemPrompt() || undefined;
        const chatEngine = await getChatEngine(
          index,
          chatEngineType,
          chatMessages,
          sessionKey || "default",
          finalSystemPrompt,
        );

        if (streaming) {
          const response = (await (
            chatEngine as
              | CondenseQuestionChatEngine
              | (ContextChatEngine & {
                  chat: (options: {
                    message: string;
                    stream: boolean;
                  }) => AsyncIterable<unknown>;
                })
          ).chat({
            message: query,
            stream: true,
          })) as AsyncGenerator<QueryChunk>;

          return {
            response: response,
            sources: [],
            streaming: true,
          };
        }

        const response = await (
          chatEngine as
            | CondenseQuestionChatEngine
            | (ContextChatEngine & {
                chat: (options: { message: string }) => {
                  response?: string;
                  sourceNodes?: SourceNode[];
                };
              })
        ).chat({ message: query });

        const sources: SourceInfo[] = [];
        if (response.sourceNodes) {
          for (const nodeWithScore of response.sourceNodes) {
            const { node, score } = nodeWithScore;
            const metadata = node.metadata as Partial<DocumentMetadata>;
            const fileName = metadata.file_name || "Unknown";
            const fileType = metadata.file_type || "Unknown";
            const scoreValue = score ? parseFloat(score.toFixed(3)) : 0;
            const content =
              typeof node.getContent === "function"
                ? node.getContent(MetadataMode.NONE)
                : "";
            const preview = content.substring(0, 200) + "...";

            sources.push({
              filename: fileName,
              fileType,
              score: scoreValue,
              text: preview,
              metadata: metadata as DocumentMetadata,
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
          errorStack: (chatError as Error).stack
            ?.split("\n")
            .slice(0, 3)
            .join("\n"),
        });
        throw chatError;
      }
    }

    // Query Engine Routing - for backward compatibility
    // Note: Query engines in LlamaIndex.TS don't directly support system messages.
    // For explicit system prompt control, use chat engines instead (via chatEngineType parameter).
    const queryEngine = await getQueryEngine(index, queryEngineType);

    if (streaming && queryEngineType === "default") {
      const response = (await (
        queryEngine as {
          query: (options: {
            query: string;
            stream: boolean;
          }) => ReadableStream<unknown>;
        }
      ).query({
        query,
        stream: true,
      })) as ReadableStream<QueryChunk>;

      return {
        response: response,
        sources: [],
        streaming: true,
      };
    }

    const response = await (
      queryEngine as {
        query: (options: { query: string }) => {
          response?: string;
          sourceNodes?: SourceNode[];
        };
      }
    ).query({ query });

    const sources: SourceInfo[] = [];
    if (response.sourceNodes) {
      for (const nodeWithScore of response.sourceNodes) {
        const { node, score } = nodeWithScore;
        const metadata = node.metadata as Partial<DocumentMetadata>;
        const fileName = metadata.file_name || "Unknown";
        const fileType = metadata.file_type || "Unknown";
        const scoreValue = score ? parseFloat(score.toFixed(3)) : 0;
        const content =
          typeof node.getContent === "function"
            ? node.getContent(MetadataMode.NONE)
            : "";
        const preview = content.substring(0, 200) + "...";

        sources.push({
          filename: fileName,
          fileType,
          score: scoreValue,
          text: preview,
          metadata: metadata as DocumentMetadata,
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
      stack: (error as Error).stack?.split("\n").slice(0, 5).join("\n"),
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
