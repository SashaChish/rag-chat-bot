import { MDocument } from "@mastra/rag";
import { embedMany } from "ai";
import type {
  RAGDocument,
  ChatMessage,
  QueryResponse,
  SourceInfo,
  DocumentMetadata,
} from "../types/core.types";
import { getEmbeddingModel, CHUNK_SIZE, CHUNK_OVERLAP } from "./config";
import {
  INDEX_NAME,
  getVectorStore,
  hasDocuments,
  ensureIndex,
} from "./vectorstore";
import { createAgent } from "./agent";

export interface AddDocumentsResult {
  success: boolean;
  documentsAdded: number;
  chunksProcessed: number;
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
    metadata: allChunks.map(
      (c) => c.metadata as Record<string, string | number | boolean>,
    ),
    documents: allChunks.map((c) => c.text),
  });

  return {
    success: true,
    documentsAdded: documents.length,
    chunksProcessed: allChunks.length,
  };
}

interface VectorQuerySource {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
  document?: string;
}

interface ToolResultPayload {
  toolName: string;
  result: unknown;
  isError?: boolean;
}

function extractSourcesFromToolResults(
  toolResults: Array<{ payload: ToolResultPayload }>,
): SourceInfo[] {
  const vectorResults = toolResults.filter(
    (r) => r.payload.toolName === "vectorQueryTool" && !r.payload.isError,
  );

  if (vectorResults.length === 0) return [];

  const allSources: SourceInfo[] = [];
  for (const entry of vectorResults) {
    const output = entry.payload.result as {
      sources?: VectorQuerySource[];
    } | null;

    if (!output?.sources) continue;

    for (const source of output.sources) {
      const metadata = (source.metadata || {}) as Partial<DocumentMetadata>;
      const fileName =
        typeof metadata.file_name === "string" ? metadata.file_name : "Unknown";
      const fileType =
        typeof metadata.file_type === "string" ? metadata.file_type : "Unknown";
      const scoreValue = source.score ? parseFloat(source.score.toFixed(3)) : 0;
      const content = source.document || "";
      const preview = content
        ? content.substring(0, 200) + (content.length > 200 ? "..." : "")
        : undefined;

      allSources.push({
        filename: fileName,
        fileType,
        score: scoreValue,
        text: preview,
        metadata: metadata as DocumentMetadata,
      });
    }
  }

  return allSources;
}

export async function executeQuery(
  query: string,
  streaming: boolean = false,
  conversationHistory: ChatMessage[] = [],
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

    const agent = createAgent({
      id: sessionKey ? `rag-agent-${sessionKey}` : "rag-agent-default",
      name: sessionKey ? `rag-agent-${sessionKey}` : "rag-agent-default",
      instructions: systemPrompt ?? undefined,
    });

    const messages = [
      ...conversationHistory,
      { role: "user" as const, content: query },
    ];

    if (streaming) {
      const streamResponse = await agent.stream(messages);

      async function* wrapStream() {
        for await (const chunk of streamResponse.textStream) {
          yield { delta: chunk } as const;
        }

        const toolResults = await streamResponse.toolResults;
        const sources = extractSourcesFromToolResults(toolResults);
        yield { done: true, sources } as const;
      }

      return {
        response: wrapStream(),
        sources: [],
        streaming: true,
      };
    }

    const result = await agent.generate(messages);
    const sources = extractSourcesFromToolResults(result.toolResults);
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
