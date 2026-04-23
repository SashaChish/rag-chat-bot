import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@llamaindex/core/schema", () => ({
  Document: class MockDocument {
    constructor(public params: object) {}
    getText() {
      return (this.params as { text: string }).text;
    }
  },
}));

vi.mock("llamaindex", () => ({
  VectorStoreIndex: {
    fromVectorStore: vi.fn().mockResolvedValue({
      asQueryEngine: vi.fn().mockReturnValue({
        query: vi.fn().mockResolvedValue({
          response: "Test response",
          sourceNodes: [],
        }),
      }),
      asRetriever: vi.fn().mockReturnValue({
        retrieve: vi.fn().mockResolvedValue([]),
      }),
    }),
    fromDocuments: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@/lib/llamaindex/vectorstore", () => ({
  getChromaVectorStore: vi.fn().mockResolvedValue({
    getCollection: vi.fn().mockResolvedValue({
      count: vi.fn().mockResolvedValue(10),
      get: vi
        .fn()
        .mockResolvedValue({ ids: ["chunk1", "chunk2"], metadatas: [] }),
      delete: vi.fn().mockResolvedValue(undefined),
    }),
  }),
  getStorageContext: vi.fn().mockResolvedValue({
    docStore: {
      addDocuments: vi.fn(),
    },
    vectorStores: {
      TEXT: { mock: "vector-store" },
    },
  }),
}));

vi.mock("@/lib/llamaindex/chatengines", () => ({
  getChatEngine: vi.fn().mockResolvedValue({
    chat: vi.fn().mockResolvedValue({
      response: "Chat response",
      sourceNodes: [],
    }),
  }),
  convertToChatMessages: vi.fn().mockImplementation((messages) => messages),
}));

vi.mock("@/lib/llamaindex/prompts", () => ({
  getSystemPrompt: vi.fn().mockReturnValue("System prompt"),
}));

vi.mock("@/lib/llamaindex/sources", () => ({
  extractSources: vi.fn().mockReturnValue([]),
}));

vi.mock("chromadb", () => ({
  IncludeEnum: {
    Documents: "documents",
    Embeddings: "embeddings",
    Metadatas: "metadatas",
    Distances: "distances",
  },
}));

describe("Index Module", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe("Function Exports", () => {
    it("should export addDocuments function", async () => {
      const { addDocuments } = await import("@/lib/llamaindex/index");
      expect(typeof addDocuments).toBe("function");
    });

    it("should export executeQuery function", async () => {
      const { executeQuery } = await import("@/lib/llamaindex/index");
      expect(typeof executeQuery).toBe("function");
    });

    it("should export deleteDocument function", async () => {
      const { deleteDocument } = await import("@/lib/llamaindex/index");
      expect(typeof deleteDocument).toBe("function");
    });

    it("should export clearIndex function", async () => {
      const { clearIndex } = await import("@/lib/llamaindex/index");
      expect(typeof clearIndex).toBe("function");
    });

    it("should export clearIndexCache function", async () => {
      const { clearIndexCache } = await import("@/lib/llamaindex/index");
      expect(typeof clearIndexCache).toBe("function");
    });
  });

  describe("executeQuery", () => {
    it("should execute query with chat engine", async () => {
      const { executeQuery } = await import("@/lib/llamaindex/index");
      const result = await executeQuery(
        "What is this about?",
        false,
        [],
        "condense",
        "test-session",
      );

      expect(result.response).toBeDefined();
      expect(result.streaming).toBe(false);
    });

    it("should return error when no engine type specified", async () => {
      const { executeQuery } = await import("@/lib/llamaindex/index");
      const result = await executeQuery("Question", false, [], null, null);

      expect(result.error).toBe("No chat engine type specified");
    });

    it("should handle conversation history", async () => {
      const { executeQuery } = await import("@/lib/llamaindex/index");
      const history = [
        { role: "user" as const, content: "Previous question" },
        { role: "assistant" as const, content: "Previous answer" },
      ];

      const result = await executeQuery(
        "Follow up question",
        false,
        history,
        "condense",
        "test-session",
      );

      expect(result).toBeDefined();
    });

    it("should handle chat engine errors", async () => {
      const { getChatEngine } = await import("@/lib/llamaindex/chatengines");
      vi.mocked(getChatEngine).mockImplementationOnce(() => {
        throw new Error("Chat engine failed");
      });

      const { executeQuery } = await import("@/lib/llamaindex/index");
      const result = await executeQuery(
        "What is this about?",
        false,
        [],
        "condense",
        "test-session",
      );

      // The error may be caught at different points in the execution
      expect(result.error).toBeDefined();
    });
  });

  describe("clearIndexCache", () => {
    it("should be callable without error", async () => {
      const { clearIndexCache } = await import("@/lib/llamaindex/index");
      expect(() => clearIndexCache()).not.toThrow();
    });
  });

  describe("deleteDocument", () => {
    it("should be callable and return result", async () => {
      const { deleteDocument } = await import("@/lib/llamaindex/index");

      const result = await deleteDocument("test.txt");

      expect(result).toHaveProperty("success");
    });

    it("should handle errors during deletion", async () => {
      const { getChromaVectorStore } =
        await import("@/lib/llamaindex/vectorstore");
      vi.mocked(getChromaVectorStore).mockRejectedValueOnce(
        new Error("Connection failed"),
      );

      const { deleteDocument } = await import("@/lib/llamaindex/index");

      const result = await deleteDocument("test.txt");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Connection failed");
    });
  });

  describe("clearIndex", () => {
    it("should be callable and return result", async () => {
      const { clearIndex } = await import("@/lib/llamaindex/index");

      const result = await clearIndex();

      expect(result).toHaveProperty("success");
    });

    it("should handle errors during clear", async () => {
      const { getChromaVectorStore } =
        await import("@/lib/llamaindex/vectorstore");
      vi.mocked(getChromaVectorStore).mockRejectedValueOnce(
        new Error("Clear failed"),
      );

      const { clearIndex } = await import("@/lib/llamaindex/index");

      const result = await clearIndex();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Clear failed");
    });
  });

  describe("addDocuments", () => {
    it("should export addDocuments function", async () => {
      const { addDocuments } = await import("@/lib/llamaindex/index");
      expect(typeof addDocuments).toBe("function");
    });
  });
});
