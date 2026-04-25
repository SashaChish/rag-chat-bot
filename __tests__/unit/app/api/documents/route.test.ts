import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

const mockLoadDocumentFromBuffer = vi.fn().mockResolvedValue({
  content: "Test content",
  filename: "test.txt",
  fileType: "txt",
  uploadDate: "2024-01-01T00:00:00Z",
});

const mockValidateFile = vi.fn();

const mockAddDocuments = vi.fn().mockResolvedValue({
  chunksProcessed: 3,
});

const { ValidationError } = await import("@/lib/api/errors");

vi.mock("@/lib/mastra/loaders", () => ({
  loadDocumentFromBuffer: mockLoadDocumentFromBuffer,
  validateFile: mockValidateFile.mockImplementation((input: unknown) => {
    if (!input || !(input instanceof File)) {
      throw new ValidationError("No file provided");
    }
    return { isValid: true, file: input };
  }),
}));

vi.mock("@/lib/mastra/vectorstore", () => ({
  addDocumentsToVectorStore: mockAddDocuments,
  getCollectionStats: vi.fn().mockResolvedValue({
    exists: true,
    collectionName: "documents",
    count: 5,
    documentCount: 2,
  }),
}));

vi.mock("@/lib/utils/format.utils", () => ({
  formatFileSize: vi.fn().mockReturnValue("1 KB"),
}));

const mockInsertReturningFn = vi.fn().mockResolvedValue([
  {
    id: "test-id",
    filename: "test.txt",
    fileType: "txt",
    fileSize: 100,
    uploadDate: "2024-01-01T00:00:00Z",
    chunkCount: 3,
    content: "Test content",
  },
]);
const mockInsertValuesFn = vi
  .fn()
  .mockReturnValue({ returning: mockInsertReturningFn });
const mockInsertFn = vi.fn().mockReturnValue({ values: mockInsertValuesFn });

vi.mock("@/lib/db", () => ({
  db: {
    insert: mockInsertFn,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  documentsTable: {
    filename: "filename",
    fileType: "fileType",
    fileSize: "fileSize",
    uploadDate: "uploadDate",
    chunkCount: "chunkCount",
    content: "content",
  },
}));

vi.mock("@/lib/db/utils", () => ({
  getAllDocuments: vi.fn().mockResolvedValue([]),
}));

const createFormDataRequest = (file: File | null): NextRequest => {
  const formData = new FormData();
  if (file) {
    formData.append("file", file);
  }

  return {
    formData: vi.fn().mockResolvedValue(formData),
    url: "http://localhost:3000/api/documents",
  } as unknown as NextRequest;
};

describe("/api/documents", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    vi.spyOn(console, "error").mockImplementation(() => {});

    mockValidateFile.mockImplementation((input: unknown) => {
      if (!input || !(input instanceof File)) {
        throw new ValidationError("No file provided");
      }
      return { isValid: true, file: input };
    });
    mockInsertFn.mockReturnValue({ values: mockInsertValuesFn });
    mockInsertValuesFn.mockReturnValue({ returning: mockInsertReturningFn });
    mockInsertReturningFn.mockResolvedValue([
      {
        id: "test-id",
        filename: "test.txt",
        fileType: "txt",
        fileSize: 100,
        uploadDate: "2024-01-01T00:00:00Z",
        chunkCount: 3,
        content: "Test content",
      },
    ]);
    mockLoadDocumentFromBuffer.mockResolvedValue({
      id: "test-id",
      content: "Test content",
      filename: "test.txt",
      fileType: "txt",
      uploadDate: "2024-01-01T00:00:00Z",
    });
    mockAddDocuments.mockResolvedValue({
      chunksProcessed: 3,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("should return 400 when no file is provided", async () => {
      const { POST } = await import("@/app/api/documents/route");
      const request = createFormDataRequest(null);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.message).toBe("No file provided");
    });

    it("should return 400 when file validation fails", async () => {
      mockValidateFile.mockImplementation(() => {
        throw new ValidationError("File too large");
      });

      const { POST } = await import("@/app/api/documents/route");
      const file = new File(["content"], "test.txt", { type: "text/plain" });
      const request = createFormDataRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.message).toBe("File too large");
    });

    it("should return 500 when loadDocumentFromBuffer throws an error", async () => {
      mockLoadDocumentFromBuffer.mockRejectedValueOnce(
        new Error("Failed to load document"),
      );

      const { POST } = await import("@/app/api/documents/route");
      const file = new File(["content"], "test.txt", { type: "text/plain" });
      const request = createFormDataRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("INTERNAL_ERROR");
    });

    it("should include document in response", async () => {
      mockLoadDocumentFromBuffer.mockResolvedValueOnce({
        id: "test-id",
        content: "Test content",
        filename: "my-doc.txt",
        fileType: "txt",
        uploadDate: "2024-01-01T00:00:00Z",
      });
      mockInsertReturningFn.mockResolvedValueOnce([
        {
          id: "test-id",
          filename: "my-doc.txt",
          fileType: "txt",
          fileSize: 100,
          uploadDate: "2024-01-01T00:00:00Z",
          chunkCount: 3,
          content: "Test content",
        },
      ]);

      const { POST } = await import("@/app/api/documents/route");
      const file = new File(["content"], "my-doc.txt", { type: "text/plain" });
      const request = createFormDataRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(data.document.filename).toBe("my-doc.txt");
      expect(data.message).toBe("Document uploaded and indexed successfully");
    });
  });

  describe("GET", () => {
    it("should return collection stats", async () => {
      const { getCollectionStats } = await import("@/lib/mastra/vectorstore");
      vi.mocked(getCollectionStats).mockResolvedValue({
        exists: true,
        collectionName: "documents",
        count: 5,
        documentCount: 2,
      });

      const { GET } = await import("@/app/api/documents/route");
      const request = {} as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats.exists).toBe(true);
      expect(data.stats.count).toBe(5);
      expect(data.stats.documentCount).toBe(2);
    });

    it("should handle errors", async () => {
      const { getCollectionStats } = await import("@/lib/mastra/vectorstore");
      vi.mocked(getCollectionStats).mockRejectedValueOnce(
        new Error("Database error"),
      );

      const { GET } = await import("@/app/api/documents/route");
      const request = {} as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("INTERNAL_ERROR");
    });
  });
});
