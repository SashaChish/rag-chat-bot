import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { RAGDocument } from "@/lib/types/core.types";
import type * as MastraRag from "@mastra/rag";

const mockListIndexes = vi.fn();
const mockDescribeIndex = vi.fn();
const mockCreateIndex = vi.fn();
const mockDeleteIndex = vi.fn();
const mockUpsert = vi.fn();
const mockDeleteVectors = vi.fn();
const mockGet = vi.fn();
const mockQuery = vi.fn();
const mockEmbedMany = vi.fn();

class MockChromaVector {
  listIndexes = mockListIndexes;
  describeIndex = mockDescribeIndex;
  createIndex = mockCreateIndex;
  deleteIndex = mockDeleteIndex;
  upsert = mockUpsert;
  deleteVectors = mockDeleteVectors;
  get = mockGet;
  query = mockQuery;
}

vi.mock("@mastra/chroma", () => ({
  ChromaVector: MockChromaVector,
  CHROMA_PROMPT: "Chroma filter instructions",
}));

vi.mock("ai", () => ({
  embedMany: mockEmbedMany,
}));

vi.mock("@mastra/core/llm", () => ({
  ModelRouterEmbeddingModel: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("@mastra/rag", async (importOriginal) => {
  const actual = await importOriginal<typeof MastraRag>();
  return {
    ...actual,
    createVectorQueryTool: vi.fn().mockReturnValue({
      execute: vi.fn(),
    }),
  };
});

const mockAgentGenerate = vi.fn().mockResolvedValue({
  text: "Test response",
  toolResults: [],
});
const mockAgentStream = vi.fn();

function createMockAgent() {
  return {
    generate: mockAgentGenerate,
    stream: mockAgentStream,
  };
}

vi.mock("@/lib/mastra/agent", () => ({
  createAgent: () => createMockAgent(),
}));

describe("index (indexing)", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    mockListIndexes.mockReset();
    mockDescribeIndex.mockReset();
    mockCreateIndex.mockReset();
    mockDeleteIndex.mockReset();
    mockUpsert.mockReset();
    mockDeleteVectors.mockReset();
    mockGet.mockReset();
    mockQuery.mockReset();
    mockEmbedMany.mockReset();
    mockAgentGenerate.mockReset();
    mockAgentGenerate.mockResolvedValue({
      text: "Test response",
      toolResults: [],
    });
    mockAgentStream.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe("addDocuments", () => {
    it("should return early with empty array", async () => {
      const { addDocuments } = await import("@/lib/mastra/index");
      const result = await addDocuments([]);

      expect(result.success).toBe(true);
      expect(result.documentsAdded).toBe(0);
      expect(result.chunksProcessed).toBe(0);
    });

    it("should process documents through chunk -> embed -> upsert pipeline", async () => {
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDescribeIndex.mockResolvedValue({ count: 1, dimension: 1536 });
      mockEmbedMany.mockResolvedValue({
        embeddings: [new Array(1536).fill(0.1)],
        values: ["chunked text content"],
        usage: { tokens: 1 },
      });

      const { addDocuments } = await import("@/lib/mastra/index");
      const doc: RAGDocument = {
        text: "Short test content",
        metadata: {
          file_name: "test.txt",
          file_type: "txt",
          upload_date: "2026-04-01",
        },
      };

      const result = await addDocuments([doc]);

      expect(result.success).toBe(true);
      expect(result.documentsAdded).toBe(1);
      expect(result.chunksProcessed).toBeGreaterThan(0);
    });
  });

  describe("executeQuery", () => {
    it("should return error when no documents available", async () => {
      mockListIndexes.mockResolvedValue([]);

      const { executeQuery } = await import("@/lib/mastra/index");
      const result = await executeQuery("test query");

      expect(result.error).toBeTruthy();
      expect(result.streaming).toBe(false);
    });

    it("should return non-streaming response with sources from tool results", async () => {
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDescribeIndex.mockResolvedValue({ count: 5, dimension: 1536 });

      mockAgentGenerate.mockResolvedValue({
        text: "Test response",
        toolResults: [
          {
            type: "tool-result",
            payload: {
              toolName: "vectorQueryTool",
              result: {
                relevantContext: "Some context",
                sources: [
                  {
                    id: "result-1",
                    score: 0.9,
                    metadata: { file_name: "test.pdf", file_type: "pdf" },
                    document: "Relevant content",
                  },
                ],
              },
            },
          },
        ],
      });

      const { executeQuery } = await import("@/lib/mastra/index");
      const result = await executeQuery("What is in the document?");

      expect(result.response).toBe("Test response");
      expect(result.streaming).toBe(false);
      expect(result.sources).toHaveLength(1);
      expect(result.sources[0].filename).toBe("test.pdf");
    });

    it("should pass conversation history to agent", async () => {
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDescribeIndex.mockResolvedValue({ count: 5, dimension: 1536 });
      mockAgentGenerate.mockResolvedValue({
        text: "Follow-up answer",
        toolResults: [],
      });

      const { executeQuery } = await import("@/lib/mastra/index");

      const history = [
        { role: "user" as const, content: "What is RAG?" },
        {
          role: "assistant" as const,
          content: "RAG stands for Retrieval-Augmented Generation.",
        },
      ];

      await executeQuery("Tell me more about it", false, history);

      expect(mockAgentGenerate).toHaveBeenCalledTimes(1);
      const messagesArg = mockAgentGenerate.mock.calls[0][0];
      expect(messagesArg).toHaveLength(3);
      expect(messagesArg[0]).toEqual({ role: "user", content: "What is RAG?" });
      expect(messagesArg[1]).toEqual({
        role: "assistant",
        content: "RAG stands for Retrieval-Augmented Generation.",
      });
      expect(messagesArg[2]).toEqual({
        role: "user",
        content: "Tell me more about it",
      });
    });

    it("should return streaming response with AsyncGenerator", async () => {
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDescribeIndex.mockResolvedValue({ count: 5, dimension: 1536 });

      async function* mockTextStream() {
        yield "Hello";
        yield " world";
      }

      mockAgentStream.mockResolvedValue({
        textStream: mockTextStream(),
        toolResults: Promise.resolve([
          {
            type: "tool-result",
            payload: {
              toolName: "vectorQueryTool",
              result: {
                relevantContext: "Streaming content",
                sources: [
                  {
                    id: "result-1",
                    score: 0.9,
                    metadata: { file_name: "doc.pdf", file_type: "pdf" },
                    document: "Streaming content",
                  },
                ],
              },
            },
          },
        ]),
      });

      const { executeQuery } = await import("@/lib/mastra/index");
      const result = await executeQuery("test query", true);

      expect(result.streaming).toBe(true);

      const chunks: QueryChunk[] = [];
      for await (const chunk of result.response as AsyncGenerator<QueryChunk>) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toEqual({ delta: "Hello" });
      expect(chunks[1]).toEqual({ delta: " world" });
      expect(chunks[2].done).toBe(true);
      expect(chunks[2].sources).toHaveLength(1);
    });

    it("should handle LLM errors gracefully", async () => {
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDescribeIndex.mockResolvedValue({ count: 5, dimension: 1536 });
      mockAgentGenerate.mockRejectedValue(new Error("LLM provider error"));

      const { executeQuery } = await import("@/lib/mastra/index");
      const result = await executeQuery("test query");

      expect(result.error).toBeTruthy();
    });

    it("should return empty sources when tool is not called", async () => {
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDescribeIndex.mockResolvedValue({ count: 5, dimension: 1536 });
      mockAgentGenerate.mockResolvedValue({
        text: "Response without tool use",
        toolResults: [],
      });

      const { executeQuery } = await import("@/lib/mastra/index");
      const result = await executeQuery("test query");

      expect(result.response).toBe("Response without tool use");
      expect(result.sources).toEqual([]);
    });
  });

  describe("session key handling", () => {
    it("should use custom system prompt when provided", async () => {
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDescribeIndex.mockResolvedValue({ count: 5, dimension: 1536 });
      mockAgentGenerate.mockResolvedValue({
        text: "Custom response",
        toolResults: [],
      });

      const { executeQuery } = await import("@/lib/mastra/index");

      await executeQuery(
        "query",
        false,
        [],
        "session-custom",
        "Custom instructions",
      );

      expect(mockAgentGenerate).toHaveBeenCalledTimes(1);
    });
  });
});

interface QueryChunk {
  delta?: string;
  done?: boolean;
  sources?: unknown[];
}
