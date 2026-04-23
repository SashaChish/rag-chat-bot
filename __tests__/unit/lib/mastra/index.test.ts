import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { RAGDocument } from "@/lib/types/core.types";

const mockListIndexes = vi.fn();
const mockDescribeIndex = vi.fn();
const mockCreateIndex = vi.fn();
const mockDeleteIndex = vi.fn();
const mockUpsert = vi.fn();
const mockDeleteVectors = vi.fn();
const mockGet = vi.fn();
const mockQuery = vi.fn();
const mockEmbedMany = vi.fn();
const mockEmbed = vi.fn();

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
}));

vi.mock("ai", () => ({
  embed: mockEmbed,
  embedMany: mockEmbedMany,
}));

vi.mock("@mastra/core/llm", () => ({
  ModelRouterEmbeddingModel: vi.fn().mockImplementation(() => ({})),
}));

const mockAgentGenerate = vi.fn().mockResolvedValue({ text: "Test response" });
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
    mockEmbed.mockReset();
    mockAgentGenerate.mockReset();
    mockAgentGenerate.mockResolvedValue({ text: "Test response" });
    mockAgentStream.mockReset();

    const { clearChatEngineCache } = await import("@/lib/mastra/index");
    clearChatEngineCache();
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

  describe("deleteDocument", () => {
    it("should call deleteDocumentByName with correct filename", async () => {
      mockDeleteVectors.mockResolvedValue(undefined);
      mockGet.mockResolvedValue([]);

      const { deleteDocument } = await import("@/lib/mastra/index");
      const result = await deleteDocument("test.pdf");

      expect(result.success).toBe(true);
      expect(mockDeleteVectors).toHaveBeenCalledWith({
        indexName: "documents",
        filter: { file_name: "test.pdf" },
      });
    });

    it("should handle errors gracefully", async () => {
      mockDeleteVectors.mockRejectedValue(new Error("Delete failed"));

      const { deleteDocument } = await import("@/lib/mastra/index");
      const result = await deleteDocument("test.pdf");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Delete failed");
    });
  });

  describe("clearIndex", () => {
    it("should call clearCollection", async () => {
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDeleteIndex.mockResolvedValue(undefined);

      const { clearIndex } = await import("@/lib/mastra/index");
      const result = await clearIndex("documents");

      expect(result.success).toBe(true);
      expect(mockDeleteIndex).toHaveBeenCalled();
    });
  });

  describe("clearIndexCache", () => {
    it("should clear chat engine cache", async () => {
      const { clearIndexCache } = await import("@/lib/mastra/index");
      expect(() => clearIndexCache()).not.toThrow();
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

    it("should return non-streaming response with sources", async () => {
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDescribeIndex.mockResolvedValue({ count: 5, dimension: 1536 });
      mockEmbed.mockResolvedValue({
        embedding: new Array(1536).fill(0.1),
        value: "test",
        usage: { tokens: 1 },
      });
      mockQuery.mockResolvedValue([
        {
          id: "result-1",
          score: 0.9,
          metadata: { file_name: "test.pdf", file_type: "pdf" },
          document: "Relevant content",
        },
      ]);

      const mod = await import("@/lib/mastra/index");
      mod.clearChatEngineCache();

      mockAgentGenerate.mockResolvedValue({ text: "Test response" });

      const result = await mod.executeQuery(
        "What is in the document?",
        false,
        [],
        "context",
      );

      expect([result.response, result.error, result.streaming]).toEqual([
        "Test response",
        undefined,
        false,
      ]);
      expect(result.sources).toHaveLength(1);
    });

    it("should pass conversation history to agent in context mode", async () => {
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDescribeIndex.mockResolvedValue({ count: 5, dimension: 1536 });
      mockEmbed.mockResolvedValue({
        embedding: new Array(1536).fill(0.1),
        value: "test",
        usage: { tokens: 1 },
      });
      mockQuery.mockResolvedValue([
        {
          id: "result-1",
          score: 0.9,
          metadata: { file_name: "doc.pdf", file_type: "pdf" },
          document: "Some content",
        },
      ]);
      mockAgentGenerate.mockResolvedValue({ text: "Follow-up answer" });

      const mod = await import("@/lib/mastra/index");
      mod.clearChatEngineCache();

      const history = [
        { role: "user" as const, content: "What is RAG?" },
        { role: "assistant" as const, content: "RAG stands for Retrieval-Augmented Generation." },
      ];

      await mod.executeQuery("Tell me more about it", false, history, "context");

      expect(mockAgentGenerate).toHaveBeenCalledTimes(1);
      const messagesArg = mockAgentGenerate.mock.calls[0][0];
      expect(messagesArg).toHaveLength(3);
      expect(messagesArg[0]).toEqual({ role: "user", content: "What is RAG?" });
      expect(messagesArg[1]).toEqual({ role: "assistant", content: "RAG stands for Retrieval-Augmented Generation." });
      expect(messagesArg[2].role).toBe("user");
      expect(messagesArg[2].content).toContain("Tell me more about it");
    });

    it("should use condense mode to rewrite query", async () => {
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDescribeIndex.mockResolvedValue({ count: 5, dimension: 1536 });
      mockEmbed.mockResolvedValue({
        embedding: new Array(1536).fill(0.1),
        value: "test",
        usage: { tokens: 1 },
      });
      mockQuery.mockResolvedValue([
        {
          id: "result-1",
          score: 0.85,
          metadata: { file_name: "doc.pdf", file_type: "pdf" },
          document: "Chunk content",
        },
      ]);

      const condenseCallCount = { value: 0 };
      mockAgentGenerate.mockImplementation(() => {
        condenseCallCount.value++;
        if (condenseCallCount.value === 1) {
          return Promise.resolve({ text: "What are the main features of RAG?" });
        }
        return Promise.resolve({ text: "RAG features include retrieval and augmentation." });
      });

      const mod = await import("@/lib/mastra/index");
      mod.clearChatEngineCache();

      const history = [
        { role: "user" as const, content: "What is RAG?" },
        { role: "assistant" as const, content: "RAG is a technique." },
      ];

      const result = await mod.executeQuery(
        "What are its main features?",
        false,
        history,
        "condense",
      );

      expect(mockAgentGenerate).toHaveBeenCalledTimes(2);
      expect(result.response).toBe("RAG features include retrieval and augmentation.");
      expect(result.sources).toHaveLength(1);
    });

    it("should return streaming response with AsyncGenerator", async () => {
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDescribeIndex.mockResolvedValue({ count: 5, dimension: 1536 });
      mockEmbed.mockResolvedValue({
        embedding: new Array(1536).fill(0.1),
        value: "test",
        usage: { tokens: 1 },
      });
      mockQuery.mockResolvedValue([
        {
          id: "result-1",
          score: 0.9,
          metadata: { file_name: "doc.pdf", file_type: "pdf" },
          document: "Streaming content",
        },
      ]);

      async function* mockTextStream() {
        yield "Hello";
        yield " world";
      }

      mockAgentStream.mockResolvedValue({
        textStream: mockTextStream(),
      });

      const mod = await import("@/lib/mastra/index");
      mod.clearChatEngineCache();

      const result = await mod.executeQuery("test query", true);

      expect(result.streaming).toBe(true);
      expect(result.sources).toHaveLength(1);

      const chunks: QueryChunk[] = [];
      for await (const chunk of result.response as AsyncGenerator<QueryChunk>) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toEqual({ delta: "Hello" });
      expect(chunks[1]).toEqual({ delta: " world" });
      expect(chunks[2]).toEqual({ done: true, sources: result.sources });
    });

    it("should handle LLM errors gracefully", async () => {
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDescribeIndex.mockResolvedValue({ count: 5, dimension: 1536 });
      mockEmbed.mockRejectedValue(new Error("LLM provider error"));

      const { executeQuery } = await import("@/lib/mastra/index");
      const result = await executeQuery("test query");

      expect(result.error).toBeTruthy();
    });
  });

  describe("agent caching", () => {
    it("should create new agent on cache miss", async () => {
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDescribeIndex.mockResolvedValue({ count: 5, dimension: 1536 });
      mockEmbed.mockResolvedValue({
        embedding: new Array(1536).fill(0.1),
        value: "test",
        usage: { tokens: 1 },
      });
      mockQuery.mockResolvedValue([]);
      mockAgentGenerate.mockResolvedValue({ text: "Response" });

      const mod = await import("@/lib/mastra/index");
      mod.clearChatEngineCache();

      await mod.executeQuery("first query", false, [], null, "session-A");

      expect(mockAgentGenerate).toHaveBeenCalledTimes(1);
    });

    it("should reuse cached agent for same session key", async () => {
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDescribeIndex.mockResolvedValue({ count: 5, dimension: 1536 });
      mockEmbed.mockResolvedValue({
        embedding: new Array(1536).fill(0.1),
        value: "test",
        usage: { tokens: 1 },
      });
      mockQuery.mockResolvedValue([]);
      mockAgentGenerate.mockResolvedValue({ text: "Response" });

      const mod = await import("@/lib/mastra/index");
      mod.clearChatEngineCache();

      await mod.executeQuery("query 1", false, [], null, "session-X");
      await mod.executeQuery("query 2", false, [], null, "session-X");

      expect(mockAgentGenerate).toHaveBeenCalledTimes(2);
    });

    it("should use custom system prompt when provided", async () => {
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDescribeIndex.mockResolvedValue({ count: 5, dimension: 1536 });
      mockEmbed.mockResolvedValue({
        embedding: new Array(1536).fill(0.1),
        value: "test",
        usage: { tokens: 1 },
      });
      mockQuery.mockResolvedValue([]);
      mockAgentGenerate.mockResolvedValue({ text: "Custom response" });

      const mod = await import("@/lib/mastra/index");
      mod.clearChatEngineCache();

      await mod.executeQuery("query", false, [], null, "session-custom", "Custom instructions");

      expect(mockAgentGenerate).toHaveBeenCalledTimes(1);
    });

    it("should clear specific session from cache", async () => {
      const { clearChatEngineCache } = await import("@/lib/mastra/index");
      expect(() => clearChatEngineCache("session-1")).not.toThrow();
    });

    it("should clear all sessions when no key provided", async () => {
      const { clearChatEngineCache } = await import("@/lib/mastra/index");
      expect(() => clearChatEngineCache()).not.toThrow();
    });
  });
});

interface QueryChunk {
  delta?: string;
  done?: boolean;
  sources?: unknown[];
}
