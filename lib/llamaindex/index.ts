import { Document } from "@llamaindex/core/schema";
import {
  VectorStoreIndex,
  type CondenseQuestionChatEngine,
  type ContextChatEngine,
} from "llamaindex";
import type {
  SourceNode,
  QueryResponse,
  ChatMessage,
  ChatEngineType,
  RAGDocument,
  QueryChunk,
} from "../types/core.types";
import { getChromaVectorStore, getStorageContext } from "./vectorstore";
import { getChatEngine, convertToChatMessages } from "./chatengines";
import { getSystemPrompt } from "./prompts";
import { extractSources } from "./sources";

let cachedIndex: VectorStoreIndex | null = null;
let indexCacheTimestamp: number = 0;
const INDEX_CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL

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

async function getChromaCollection() {
  const vectorStore = await getChromaVectorStore();
  return await vectorStore.getCollection();
}

async function getOrCreateIndex(): Promise<VectorStoreIndex> {
  const now = Date.now();

  if (cachedIndex && now - indexCacheTimestamp < INDEX_CACHE_TTL) {
    return cachedIndex;
  }

  const vectorStore = await getChromaVectorStore();
  cachedIndex = await VectorStoreIndex.fromVectorStore(vectorStore);
  indexCacheTimestamp = now;
  return cachedIndex;
}

export function clearIndexCache(): void {
  cachedIndex = null;
  indexCacheTimestamp = 0;
}

export async function deleteDocument(
  documentId: string,
): Promise<DeleteDocumentResult> {
  try {
    const coll = await getChromaCollection();

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
    const vectorStore = await getChromaVectorStore();
    const coll = await vectorStore.getCollection();

    console.log(
      `[clearIndex] Starting clear for collection: ${collectionName}`,
    );

    const ids = await coll.get({});

    if (ids.ids && ids.ids.length > 0) {
      await coll.delete({ ids: ids.ids });
      console.log(`[clearIndex] Deleted ${ids.ids.length} documents`);
    } else {
      console.log(`[clearIndex] No documents to delete`);
    }

    clearIndexCache();

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

  const storageContext = await getStorageContext();

  await VectorStoreIndex.fromDocuments(llamaDocuments, {
    storageContext,
    vectorStores: {
      TEXT: storageContext.vectorStores.TEXT,
    },
  });

  clearIndexCache();

  return {
    success: true,
    added: llamaDocuments.length,
    indexCreated: true,
  };
}

export async function executeQuery(
  query: string,
  streaming: boolean = false,
  conversationHistory: ChatMessage[] = [],
  chatEngineType: ChatEngineType | null = null,
  sessionKey: string | null = null,
  systemPrompt: string | null = null,
): Promise<QueryResponse> {
  try {
    const index = await getOrCreateIndex();

    // Chat Engine Routing - handles all query use cases including conversation history
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
          const response = await chatEngine.chat({
            message: query,
            stream: true,
          });

          return {
            response: response as AsyncGenerator<QueryChunk>,
            sources: [],
            streaming: true,
          };
        }

        const response = await (
          chatEngine as CondenseQuestionChatEngine | ContextChatEngine
        ).chat({ message: query });

        return {
          response: response.response || response.toString(),
          sources: extractSources(response.sourceNodes as SourceNode[]),
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

    return {
      response: "",
      sources: [],
      error: "No chat engine type specified",
      streaming: false,
    };
  } catch (error) {
    console.error("Error executing query:", {
      message: (error as Error).message,
      stack: (error as Error).stack?.split("\n").slice(0, 5).join("\n"),
      queryLength: query?.length,
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
