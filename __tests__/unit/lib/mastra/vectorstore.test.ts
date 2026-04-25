import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  getVectorStore,
  hasDocuments,
  deleteDocumentChunks,
  getCollectionStats,
  clearCollection,
  INDEX_NAME,
} from "@/lib/mastra/vectorstore";

const {
  mockListIndexes,
  mockDescribeIndex,
  mockCreateIndex,
  mockDeleteIndex,
  mockDeleteVectors,
  mockGet,
  mockSelectWhereFn,
  mockFromFn,
  mockSelectFn,
  mockDeleteWhereFn,
  mockDeleteFn,
  MockChromaVector,
} = vi.hoisted(() => {
  const mockListIndexes = vi.fn();
  const mockDescribeIndex = vi.fn();
  const mockCreateIndex = vi.fn();
  const mockDeleteIndex = vi.fn();
  const mockDeleteVectors = vi.fn();
  const mockGet = vi.fn();

  class MockChromaVector {
    listIndexes = mockListIndexes;
    describeIndex = mockDescribeIndex;
    createIndex = mockCreateIndex;
    deleteIndex = mockDeleteIndex;
    deleteVectors = mockDeleteVectors;
    get = mockGet;
  }

  const mockSelectWhereFn = vi.fn().mockResolvedValue([]);

  const mockFromFn = vi.fn().mockReturnValue({
    where: mockSelectWhereFn,
    then: (resolve: (v: unknown) => void) => Promise.resolve([]).then(resolve),
  });

  const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

  const mockDeleteWhereFn = vi.fn().mockResolvedValue(undefined);

  const mockDeleteFn = vi.fn().mockReturnValue({
    where: mockDeleteWhereFn,
    then: (resolve: (v: unknown) => void) =>
      Promise.resolve(undefined).then(resolve),
  });

  return {
    mockListIndexes,
    mockDescribeIndex,
    mockCreateIndex,
    mockDeleteIndex,
    mockDeleteVectors,
    mockGet,
    mockSelectWhereFn,
    mockFromFn,
    mockSelectFn,
    mockDeleteWhereFn,
    mockDeleteFn,
    MockChromaVector,
  };
});

vi.mock("@mastra/chroma", () => ({
  ChromaVector: MockChromaVector,
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: mockSelectFn,
    delete: mockDeleteFn,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  documentsTable: {
    filename: "file_name",
    fileType: "file_type",
    fileSize: "file_size",
    uploadDate: "upload_date",
    chunkCount: "chunk_count",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn().mockReturnValue({}),
  count: vi.fn().mockReturnValue("count"),
}));

describe("vectorstore", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, CHROMA_URL: "http://localhost:8000" };
    mockListIndexes.mockReset();
    mockDescribeIndex.mockReset();
    mockCreateIndex.mockReset();
    mockDeleteIndex.mockReset();
    mockDeleteVectors.mockReset();
    mockGet.mockReset();
    mockSelectFn.mockReset();
    mockDeleteFn.mockReset();
    mockDeleteWhereFn.mockReset();
    mockFromFn.mockReset();
    mockSelectWhereFn.mockReset();

    mockSelectWhereFn.mockResolvedValue([]);
    mockFromFn.mockReturnValue({
      where: mockSelectWhereFn,
      then: (resolve: (v: unknown) => void) =>
        Promise.resolve([]).then(resolve),
    });
    mockSelectFn.mockReturnValue({ from: mockFromFn });
    mockDeleteWhereFn.mockResolvedValue(undefined);
    mockDeleteFn.mockReturnValue({
      where: mockDeleteWhereFn,
      then: (resolve: (v: unknown) => void) =>
        Promise.resolve(undefined).then(resolve),
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe("getVectorStore", () => {
    it("should create a ChromaVector instance", () => {
      const store = getVectorStore();
      expect(store).toBeDefined();
      expect(store).toBeInstanceOf(MockChromaVector);
    });
  });

  describe("hasDocuments", () => {
    it("should return true when ChromaDB has documents", async () => {
      mockDescribeIndex.mockResolvedValue({ count: 5 });

      const result = await hasDocuments();
      expect(result).toBe(true);
    });

    it("should return false when ChromaDB is empty", async () => {
      mockDescribeIndex.mockResolvedValue({ count: 0 });

      const result = await hasDocuments();
      expect(result).toBe(false);
    });

    it("should return false on error", async () => {
      mockDescribeIndex.mockRejectedValue(new Error("Connection failed"));

      const result = await hasDocuments();
      expect(result).toBe(false);
    });
  });

  describe("deleteDocumentChunks", () => {
    it("should delete vectors from ChromaDB by document ID", async () => {
      mockDeleteVectors.mockResolvedValue(undefined);

      await deleteDocumentChunks("test-id");

      expect(mockDeleteVectors).toHaveBeenCalledWith({
        indexName: "documents",
        filter: { document_id: "test-id" },
      });
    });

    it("should throw when vector deletion fails", async () => {
      mockDeleteVectors.mockRejectedValue(new Error("Connection failed"));

      await expect(deleteDocumentChunks("test-id")).rejects.toThrow(
        "Failed to delete document from Vector Store",
      );
    });
  });

  describe("getCollectionStats", () => {
    it("should return correct stats from Postgres and ChromaDB", async () => {
      mockFromFn.mockReturnValue({
        where: mockSelectWhereFn,
        then: (resolve: (v: unknown) => void) =>
          Promise.resolve([{ count: 2 }]).then(resolve),
      });
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDescribeIndex.mockResolvedValue({ count: 10, dimension: 1536 });

      const stats = await getCollectionStats();

      expect(stats.exists).toBe(true);
      expect(stats.count).toBe(10);
      expect(stats.documentCount).toBe(2);
    });

    it("should return stats when ChromaDB index does not exist", async () => {
      mockFromFn.mockReturnValue({
        where: mockSelectWhereFn,
        then: (resolve: (v: unknown) => void) =>
          Promise.resolve([{ count: 3 }]).then(resolve),
      });
      mockListIndexes.mockResolvedValue([]);

      const stats = await getCollectionStats();

      expect(stats.exists).toBe(true);
      expect(stats.count).toBe(0);
      expect(stats.documentCount).toBe(3);
    });

    it("should return empty stats when both stores are empty", async () => {
      mockFromFn.mockReturnValue({
        where: mockSelectWhereFn,
        then: (resolve: (v: unknown) => void) =>
          Promise.resolve([{ count: 0 }]).then(resolve),
      });
      mockListIndexes.mockResolvedValue([]);

      const stats = await getCollectionStats();

      expect(stats.exists).toBe(false);
      expect(stats.count).toBe(0);
      expect(stats.documentCount).toBe(0);
    });
  });

  describe("clearCollection", () => {
    it("should delete from Postgres and delete existing ChromaDB index", async () => {
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDeleteIndex.mockResolvedValue(undefined);

      await clearCollection();

      expect(mockDeleteFn).toHaveBeenCalled();
      expect(mockDeleteIndex).toHaveBeenCalledWith({ indexName: "documents" });
    });

    it("should delete from Postgres even when ChromaDB index does not exist", async () => {
      mockListIndexes.mockResolvedValue([]);

      await clearCollection();

      expect(mockDeleteFn).toHaveBeenCalled();
      expect(mockDeleteIndex).not.toHaveBeenCalled();
    });
  });

  describe("INDEX_NAME", () => {
    it("should export INDEX_NAME constant", () => {
      expect(INDEX_NAME).toBe("documents");
    });
  });
});
