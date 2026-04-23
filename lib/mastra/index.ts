import { MDocument } from "@mastra/rag";
import { embedMany } from "ai";
import type { RAGDocument, ChatMessage, ChatEngineType, QueryResponse, SourceInfo } from "../types/core.types";
import { getEmbeddingModel } from "./config";
import {
  getVectorStore,
  hasDocuments,
  ensureIndex,
  clearCollection,
  deleteDocumentByName as vsDeleteDocumentByName,
} from "./vectorstore";
import { extractSources } from "./sources";
import { createAgent } from "./agent";
import { convertToChatMessages } from "./chat";
import { embed } from "ai";

const INDEX_NAME = "documents";
const TOP_K = 3;

const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || "512", 10);
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP || "50", 10);

export interface AddDocumentsResult {
  success: boolean;
  documentsAdded: number;
  chunksProcessed: number;
}

export interface DeleteDocumentResult {
  success: boolean;
  chunksDeleted: number;
  error?: string;
}

export interface ClearIndexResult {
  success: boolean;
  error?: string;
}

export async function addDocuments(
  documents: RAGDocument[],
): Promise<AddDocumentsResult> {
  if (documents.length === 0) {
    return { success: true, documentsAdded: 0, chunksProcessed: 0 };
  }

  const allChunks: { text: string; metadata: Record<string, unknown> }[] = [];

  for (const doc of documents) {
    const fileName = doc.metadata.file_name || "Unknown";
    const fileType = doc.metadata.file_type || "Unknown";
    const uploadDate = doc.metadata.upload_date || new Date().toISOString();

    const mDoc =
      fileType === "md"
        ? MDocument.fromMarkdown(doc.text, { file_name: fileName })
        : MDocument.fromText(doc.text, { file_name: fileName });

    const chunks = await mDoc.chunk({
      strategy: "recursive",
      maxSize: CHUNK_SIZE,
      overlap: CHUNK_OVERLAP,
    });

    for (let i = 0; i < chunks.length; i++) {
      allChunks.push({
        text: chunks[i].text,
        metadata: {
          file_name: fileName,
          file_type: fileType,
          upload_date: uploadDate,
          chunk_index: i,
          chunk_text: chunks[i].text,
        },
      });
    }
  }

  const embeddingModel = getEmbeddingModel();
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: allChunks.map((c) => c.text),
  });

  await ensureIndex(embeddings[0].length);

  const store = getVectorStore();
  await store.upsert({
    indexName: INDEX_NAME,
    vectors: embeddings,
    metadata: allChunks.map((c) => c.metadata as Record<string, string | number | boolean>),
    documents: allChunks.map((c) => c.text),
  });

  return {
    success: true,
    documentsAdded: documents.length,
    chunksProcessed: allChunks.length,
  };
}

export async function deleteDocument(
  documentId: string,
): Promise<DeleteDocumentResult> {
  try {
    const deletedCount = await vsDeleteDocumentByName(documentId);
    return { success: true, chunksDeleted: deletedCount };
  } catch (error) {
    return {
      success: false,
      chunksDeleted: 0,
      error: (error as Error).message,
    };
  }
}

export async function clearIndex(
  _collectionName: string = INDEX_NAME,
): Promise<ClearIndexResult> {
  try {
    await clearCollection();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

export function clearIndexCache(): void {
  clearChatEngineCache();
}

// --- Chat Engine Cache ---

type RAGAgent = ReturnType<typeof createAgent>;

const chatEngineCache = new Map<string, RAGAgent>();

function getAgent(
  sessionKey: string,
  systemPrompt: string | null,
): RAGAgent {
  const cacheKey = sessionKey;

  if (chatEngineCache.has(cacheKey)) {
    return chatEngineCache.get(cacheKey)!;
  }

  const agent = createAgent({
    id: `rag-agent-${sessionKey}`,
    name: `rag-agent-${sessionKey}`,
    instructions: systemPrompt ?? undefined,
  });

  chatEngineCache.set(cacheKey, agent);
  return agent;
}

export function clearChatEngineCache(sessionKey?: string): void {
  if (sessionKey) {
    chatEngineCache.delete(sessionKey);
  } else {
    chatEngineCache.clear();
  }
}

// --- Query Execution ---

async function retrieveContext(query: string): Promise<{
  results: { id: string; score: number; metadata?: Record<string, unknown>; document?: string }[];
  sources: SourceInfo[];
  contextText: string;
}> {
  const embeddingModel = getEmbeddingModel();
  const { embedding: queryVector } = await embed({
    model: embeddingModel,
    value: query,
  });

  await ensureIndex(queryVector.length);

  const store = getVectorStore();
  const results = await store.query({
    indexName: INDEX_NAME,
    queryVector,
    topK: TOP_K,
  });

  const sources = extractSources(results);
  const contextText = results
    .map((r) => r.document || "")
    .filter(Boolean)
    .join("\n\n");

  return { results, sources, contextText };
}

async function buildCondensedQuery(
  query: string,
  conversationHistory: ChatMessage[],
): Promise<string> {
  if (conversationHistory.length === 0) return query;

  const historyText = conversationHistory
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const condensingAgent = createAgent({
    id: "query-condenser",
    name: "query-condenser",
    instructions:
      "Given a conversation history and a follow-up question, rephrase the follow-up question to be a standalone question that can be understood without the conversation history. Return ONLY the rephrased question, nothing else.",
  });

  const result = await condensingAgent.generate(
    `Conversation history:\n${historyText}\n\nFollow-up question: ${query}`,
  );

  return result.text || query;
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
    const docsExist = await hasDocuments();
    if (!docsExist) {
      return {
        response: "",
        sources: [],
        error: "No documents available for querying",
        streaming: false,
      };
    }

    const effectiveSessionKey = sessionKey || "default";
    const agent = getAgent(effectiveSessionKey, systemPrompt);

    const retrievalQuery =
      chatEngineType === "condense"
        ? await buildCondensedQuery(query, conversationHistory)
        : query;

    const { sources, contextText } = await retrieveContext(retrievalQuery);

    const contextPrefix = contextText
      ? `Here is the relevant context from the documents:\n\n=== CONTEXT START ===\n${contextText}\n=== CONTEXT END ===\n\n`
      : "No relevant documents were found for this query.\n\n";

    const fullPrompt = `${contextPrefix}User question: ${query}`;

    const messages = [
      ...convertToChatMessages(conversationHistory),
      { role: "user" as const, content: fullPrompt },
    ];

    if (streaming) {
      const stream = await agent.stream(messages);

      async function* wrapStream() {
        for await (const chunk of stream.textStream) {
          yield { delta: chunk } as const;
        }
        yield { done: true, sources } as const;
      }

      return {
        response: wrapStream(),
        sources,
        streaming: true,
      };
    }

    const result = await agent.generate(messages);
    return {
      response: result.text,
      sources,
      streaming: false,
    };
  } catch (error) {
    console.error("Error executing query:", error);
    return {
      response: "",
      sources: [],
      error: (error as Error).message,
      streaming: false,
    };
  }
}
