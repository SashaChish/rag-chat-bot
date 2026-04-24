import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

const mockLoadDocumentFromBuffer = vi.fn().mockResolvedValue({
  documents: [
    {
      text: "Test content",
      metadata: {
        file_name: "test.txt",
        file_type: "txt",
        upload_date: "2024-01-01T00:00:00Z",
      },
    },
  ],
});

const mockValidateFile = vi.fn().mockReturnValue(true);

const mockAddDocuments = vi.fn().mockResolvedValue({
  success: true,
  documentsAdded: 1,
  chunksProcessed: 3,
});

vi.mock("@/lib/mastra/loaders", () => ({
  loadDocumentFromBuffer: mockLoadDocumentFromBuffer,
  validateFile: mockValidateFile,
}));

vi.mock("@/lib/mastra/index", () => ({
  addDocuments: mockAddDocuments,
}));

vi.mock("@/lib/mastra/vectorstore", () => ({
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

    mockValidateFile.mockReturnValue(true);
    mockLoadDocumentFromBuffer.mockResolvedValue({
      documents: [
        {
          text: "Test content",
          metadata: {
            file_name: "test.txt",
            file_type: "txt",
            upload_date: "2024-01-01T00:00:00Z",
          },
        },
      ],
    });
    mockAddDocuments.mockResolvedValue({
      success: true,
      documentsAdded: 1,
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
      const { ValidationError } = await import("@/lib/api/errors");
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

    it("should return 500 when documents array is empty", async () => {
      mockLoadDocumentFromBuffer.mockResolvedValueOnce({
        documents: [],
      });

      const { POST } = await import("@/app/api/documents/route");
      const file = new File(["content"], "test.txt", { type: "text/plain" });
      const request = createFormDataRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("INTERNAL_ERROR");
    });

    it("should use file.name as document ID in response", async () => {
      const { POST } = await import("@/app/api/documents/route");
      const file = new File(["content"], "my-doc.txt", { type: "text/plain" });
      const request = createFormDataRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(data.id).toBe("my-doc.txt");
      expect(data.filename).toBe("my-doc.txt");
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
      const { getCollectionStats } =
        await import("@/lib/mastra/vectorstore");
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
