import type {
  ChatMessage,
  QueryResponse,
  SourceInfo,
  DocumentMetadata,
} from "../types/core.types";
import { hasDocuments } from "./vectorstore";
import { createAgent } from "./agent";

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
