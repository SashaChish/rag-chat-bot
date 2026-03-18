import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/llamaindex/settings", () => ({
  initializeSettings: vi.fn(),
}));

vi.mock("@llamaindex/core/schema", () => ({
  Document: vi.fn().mockImplementation((params) => params),
}));

vi.mock("llamaindex", () => ({
  VectorStoreIndex: {
    fromDocuments: vi.fn().mockResolvedValue({}),
  },
}));

const mockLoadDocumentFromBuffer = vi.fn().mockResolvedValue({
  documents: [
    {
      text: "Test content",
      metadata: {
        file_name: "test.txt",
        file_type: "TEXT",
        upload_date: "2024-01-01T00:00:00Z",
      },
    },
  ],
});

const mockValidateFile = vi.fn().mockReturnValue(true);

vi.mock("@/lib/llamaindex/loaders", () => ({
  loadDocumentFromBuffer: mockLoadDocumentFromBuffer,
  validateFile: mockValidateFile,
  getSupportedFormatsList: vi.fn().mockReturnValue([
    { type: "PDF", extensions: ".pdf" },
    { type: "TEXT", extensions: ".txt" },
  ]),
}));

vi.mock("@/lib/llamaindex/vectorstore", () => ({
  getChromaVectorStore: vi.fn().mockResolvedValue({
    getCollection: vi.fn().mockResolvedValue({
      count: vi.fn().mockResolvedValue(5),
      get: vi.fn().mockResolvedValue({ ids: [], metadatas: [], documents: [] }),
      delete: vi.fn().mockResolvedValue(undefined),
    }),
  }),
  getStorageContext: vi.fn().mockResolvedValue({
    docStore: {
      addDocuments: vi.fn(),
    },
    vectorStores: { TEXT: {} },
  }),
  getCollectionStats: vi.fn().mockResolvedValue({
    exists: true,
    collectionName: "documents",
    count: 5,
    documentCount: 2,
  }),
  getAllDocuments: vi.fn().mockResolvedValue({
    documents: [
      {
        file_name: "doc1.txt",
        file_type: "TEXT",
        chunk_count: 3,
        upload_date: "2024-01-01T00:00:00Z",
        first_chunk_id: "chunk-1",
      },
    ],
    total_chunks: 3,
  }),
}));

vi.mock("@/lib/llamaindex/utils", () => ({
  generateDocumentId: vi.fn().mockReturnValue("doc-123"),
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

const createGetRequest = (action: string | null = null): NextRequest => {
  const url = action
    ? `http://localhost:3000/api/documents?action=${action}`
    : "http://localhost:3000/api/documents";

  return {
    url,
  } as unknown as NextRequest;
};

describe("/api/documents", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Reset mock implementations
    mockValidateFile.mockReturnValue(true);
    mockLoadDocumentFromBuffer.mockResolvedValue({
      documents: [
        {
          text: "Test content",
          metadata: {
            file_name: "test.txt",
            file_type: "TEXT",
            upload_date: "2024-01-01T00:00:00Z",
          },
        },
      ],
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
      expect(data.error).toBe("No file provided");
    });

    it("should return 400 when file validation fails", async () => {
      mockValidateFile.mockImplementation(() => {
        throw new Error("File too large");
      });

      const { POST } = await import("@/app/api/documents/route");
      const file = new File(["content"], "test.txt", { type: "text/plain" });
      const request = createFormDataRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("File too large");
    });

    it("should return 500 when loadDocumentFromBuffer throws an error", async () => {
      mockLoadDocumentFromBuffer.mockRejectedValueOnce(new Error("Failed to load document"));

      const { POST } = await import("@/app/api/documents/route");
      const file = new File(["content"], "test.txt", { type: "text/plain" });
      const request = createFormDataRequest(file);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to load document");
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
      expect(data.error).toBe("No content could be extracted from file");
    });

    it("should return 500 on internal error", async () => {
      mockValidateFile.mockImplementation(() => {
        throw new Error("Internal error");
      });

      const { POST } = await import("@/app/api/documents/route");
      const file = new File(["content"], "test.txt", { type: "text/plain" });
      const request = createFormDataRequest(file);

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe("GET", () => {
    it("should return 500 on error for stats request", async () => {
      const { getCollectionStats } = await import("@/lib/llamaindex/vectorstore");
      vi.mocked(getCollectionStats).mockRejectedValueOnce(new Error("Database error"));

      const { GET } = await import("@/app/api/documents/route");
      const request = createGetRequest();

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to retrieve document information");
    });

    it("should return 500 on error for list request", async () => {
      const { getAllDocuments } = await import("@/lib/llamaindex/vectorstore");
      vi.mocked(getAllDocuments).mockRejectedValueOnce(new Error("Database error"));

      const { GET } = await import("@/app/api/documents/route");
      const request = createGetRequest("list");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to retrieve document list");
    });
  });

  describe("OPTIONS", () => {
    it("should return CORS headers", async () => {
      const { OPTIONS } = await import("@/app/api/documents/route");

      const response = await OPTIONS();

      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });

    it("should return correct CORS methods", async () => {
      const { OPTIONS } = await import("@/app/api/documents/route");

      const response = await OPTIONS();

      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, DELETE, OPTIONS");
    });

    it("should return correct CORS headers for content-type", async () => {
      const { OPTIONS } = await import("@/app/api/documents/route");

      const response = await OPTIONS();

      expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type");
    });
  });
});
