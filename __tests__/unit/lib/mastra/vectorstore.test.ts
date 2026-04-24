import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

vi.mock("@mastra/chroma", () => ({
  ChromaVector: MockChromaVector,
}));

describe("vectorstore", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    mockListIndexes.mockReset();
    mockDescribeIndex.mockReset();
    mockCreateIndex.mockReset();
    mockDeleteIndex.mockReset();
    mockDeleteVectors.mockReset();
    mockGet.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  async function importFreshVectorstore() {
    vi.resetModules();
    const mod = await import("@/lib/mastra/vectorstore");
    return mod;
  }

  describe("getVectorStore", () => {
    it("should create a ChromaVector instance", async () => {
      const { getVectorStore } = await importFreshVectorstore();
      const store = getVectorStore();
      expect(store).toBeDefined();
      expect(store).toBeInstanceOf(MockChromaVector);
    });
  });

  describe("hasDocuments", () => {
    it("should return true when index has documents", async () => {
      mockDescribeIndex.mockResolvedValue({ count: 5, dimension: 1536 });

      const { hasDocuments } = await importFreshVectorstore();
      const result = await hasDocuments();
      expect(result).toBe(true);
      expect(mockListIndexes).not.toHaveBeenCalled();
    });

    it("should return false when index is empty", async () => {
      mockDescribeIndex.mockResolvedValue({ count: 0, dimension: 1536 });

      const { hasDocuments } = await importFreshVectorstore();
      const result = await hasDocuments();
      expect(result).toBe(false);
    });

    it("should return false when index does not exist (describeIndex throws)", async () => {
      mockDescribeIndex.mockRejectedValue(new Error("Not found"));

      const { hasDocuments } = await importFreshVectorstore();
      const result = await hasDocuments();
      expect(result).toBe(false);
    });

    it("should return false on error", async () => {
      mockDescribeIndex.mockRejectedValue(new Error("Connection failed"));

      const { hasDocuments } = await importFreshVectorstore();
      const result = await hasDocuments();
      expect(result).toBe(false);
    });
  });

  describe("getAllDocuments", () => {
    it("should return empty when no indexes exist", async () => {
      mockListIndexes.mockResolvedValue([]);

      const { getAllDocuments } = await importFreshVectorstore();
      const result = await getAllDocuments();
      expect(result.documents).toEqual([]);
      expect(result.total_chunks).toBe(0);
    });

    it("should map query results to document summaries", async () => {
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDescribeIndex.mockResolvedValue({ count: 2, dimension: 1536 });
      mockGet.mockResolvedValue([
        {
          id: "chunk-1",
          metadata: { file_name: "test.pdf", file_type: "pdf", upload_date: "2026-04-01" },
          document: "text 1",
        },
        {
          id: "chunk-2",
          metadata: { file_name: "test.pdf", file_type: "pdf", upload_date: "2026-04-01" },
          document: "text 2",
        },
      ]);

      const { getAllDocuments } = await importFreshVectorstore();
      const result = await getAllDocuments();

      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].file_name).toBe("test.pdf");
      expect(result.documents[0].chunk_count).toBe(2);
      expect(result.total_chunks).toBe(2);
      expect(mockGet).toHaveBeenCalledWith({
        indexName: "documents",
        limit: 2,
      });
    });
  });

  describe("deleteDocumentByName", () => {
    it("should query chunk count before deletion and return it", async () => {
      mockGet.mockResolvedValue([
        { id: "1", metadata: { file_name: "test.pdf" } },
        { id: "2", metadata: { file_name: "test.pdf" } },
        { id: "3", metadata: { file_name: "test.pdf" } },
      ]);
      mockDeleteVectors.mockResolvedValue(undefined);

      const { deleteDocumentByName } = await importFreshVectorstore();
      const result = await deleteDocumentByName("test.pdf");

      expect(mockGet).toHaveBeenCalledWith({
        indexName: "documents",
        filter: { file_name: "test.pdf" },
      });
      expect(mockDeleteVectors).toHaveBeenCalledWith({
        indexName: "documents",
        filter: { file_name: "test.pdf" },
      });
      expect(result).toBe(3);
    });

    it("should return 0 for non-existent documents", async () => {
      mockGet.mockResolvedValue([]);
      mockDeleteVectors.mockResolvedValue(undefined);

      const { deleteDocumentByName } = await importFreshVectorstore();
      const result = await deleteDocumentByName("nonexistent.pdf");

      expect(result).toBe(0);
    });
  });

  describe("getDocumentStats", () => {
    it("should return stats for existing document", async () => {
      mockGet.mockResolvedValue([
        {
          id: "chunk-1",
          metadata: { file_name: "test.pdf", file_type: "pdf", upload_date: "2026-04-01" },
          document: "text 1",
        },
        {
          id: "chunk-2",
          metadata: { file_name: "test.pdf", file_type: "pdf", upload_date: "2026-04-01" },
          document: "text 2",
        },
      ]);

      const { getDocumentStats } = await importFreshVectorstore();
      const stats = await getDocumentStats("test.pdf");

      expect(stats.exists).toBe(true);
      expect(stats.chunk_count).toBe(2);
      expect(stats.file_type).toBe("pdf");
      expect(stats.upload_date).toBe("2026-04-01");
    });

    it("should return not-exists for missing documents", async () => {
      mockGet.mockResolvedValue([]);

      const { getDocumentStats } = await importFreshVectorstore();
      const stats = await getDocumentStats("missing.pdf");

      expect(stats.exists).toBe(false);
      expect(stats.chunk_count).toBe(0);
      expect(stats.file_type).toBeNull();
      expect(stats.upload_date).toBeNull();
    });

    it("should return not-exists on error", async () => {
      mockGet.mockRejectedValue(new Error("Connection failed"));

      const { getDocumentStats } = await importFreshVectorstore();
      const stats = await getDocumentStats("test.pdf");

      expect(stats.exists).toBe(false);
      expect(stats.chunk_count).toBe(0);
    });
  });

  describe("getCollectionStats", () => {
    it("should return correct stats using lightweight count path", async () => {
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDescribeIndex.mockResolvedValue({ count: 10, dimension: 1536 });
      mockGet.mockResolvedValue([
        { id: "1", metadata: { file_name: "a.pdf" } },
        { id: "2", metadata: { file_name: "a.pdf" } },
        { id: "3", metadata: { file_name: "b.pdf" } },
      ]);

      const { getCollectionStats } = await importFreshVectorstore();
      const stats = await getCollectionStats();

      expect(stats.exists).toBe(true);
      expect(stats.count).toBe(10);
      expect(stats.documentCount).toBe(2);
      expect(mockGet).toHaveBeenCalledWith({
        indexName: "documents",
        limit: 10,
      });
    });

    it("should return empty stats when index does not exist", async () => {
      mockListIndexes.mockResolvedValue([]);

      const { getCollectionStats } = await importFreshVectorstore();
      const stats = await getCollectionStats();

      expect(stats.exists).toBe(false);
      expect(stats.count).toBe(0);
    });

    it("should return zero documentCount when collection has no vectors", async () => {
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDescribeIndex.mockResolvedValue({ count: 0, dimension: 1536 });

      const { getCollectionStats } = await importFreshVectorstore();
      const stats = await getCollectionStats();

      expect(stats.exists).toBe(true);
      expect(stats.count).toBe(0);
      expect(stats.documentCount).toBe(0);
      expect(mockGet).not.toHaveBeenCalled();
    });
  });

  describe("clearCollection", () => {
    it("should delete existing index", async () => {
      mockListIndexes.mockResolvedValue(["documents"]);
      mockDeleteIndex.mockResolvedValue(undefined);

      const { clearCollection } = await importFreshVectorstore();
      await clearCollection();

      expect(mockDeleteIndex).toHaveBeenCalledWith({ indexName: "documents" });
      expect(mockCreateIndex).not.toHaveBeenCalled();
    });

    it("should do nothing when index does not exist", async () => {
      mockListIndexes.mockResolvedValue([]);

      const { clearCollection } = await importFreshVectorstore();
      await clearCollection();

      expect(mockDeleteIndex).not.toHaveBeenCalled();
      expect(mockCreateIndex).not.toHaveBeenCalled();
    });
  });

  describe("getDocumentContent", () => {
    it("should return joined document text", async () => {
      mockGet.mockResolvedValue([
        { id: "1", document: "Paragraph 1" },
        { id: "2", document: "Paragraph 2" },
      ]);

      const { getDocumentContent } = await importFreshVectorstore();
      const content = await getDocumentContent("test.pdf");

      expect(content).toBe("Paragraph 1\n\nParagraph 2");
    });

    it("should return null when document not found", async () => {
      mockGet.mockResolvedValue([]);

      const { getDocumentContent } = await importFreshVectorstore();
      const content = await getDocumentContent("nonexistent.pdf");

      expect(content).toBeNull();
    });

    it("should return null on error", async () => {
      mockGet.mockRejectedValue(new Error("Connection failed"));

      const { getDocumentContent } = await importFreshVectorstore();
      const content = await getDocumentContent("test.pdf");

      expect(content).toBeNull();
    });
  });

  describe("INDEX_NAME", () => {
    it("should export INDEX_NAME constant", async () => {
      const { INDEX_NAME } = await importFreshVectorstore();
      expect(INDEX_NAME).toBe("documents");
    });
  });
});
