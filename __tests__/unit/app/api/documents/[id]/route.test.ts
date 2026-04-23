import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";
import { DELETE, GET } from "@/app/api/documents/[id]/route";

vi.mock("@/lib/mastra/index", () => ({
  deleteDocument: vi.fn(),
}));

vi.mock("@/lib/mastra/vectorstore", () => ({
  getDocumentContent: vi.fn(),
  getCollectionStats: vi.fn(),
}));

const createMockRequest = (url: string): NextRequest => {
  return {
    url,
  } as unknown as NextRequest;
};

const createParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/api/documents/[id]", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe("DELETE", () => {
    it("should return 400 when ID is missing", async () => {
      const request = createMockRequest("http://localhost:3000/api/documents/");
      const response = await DELETE(request, createParams(""));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Document ID is required");
    });

    it("should delete document successfully", async () => {
      const { deleteDocument } = await import("@/lib/mastra/index");

      vi.mocked(deleteDocument).mockResolvedValue({
        success: true,
        chunksDeleted: 3,
      });

      const request = createMockRequest(
        "http://localhost:3000/api/documents/test.txt",
      );
      const response = await DELETE(request, createParams("test.txt"));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toBe("Document deleted successfully");
    });

    it("should return error when delete fails", async () => {
      const { deleteDocument } = await import("@/lib/mastra/index");

      vi.mocked(deleteDocument).mockResolvedValue({
        success: false,
        error: "Delete failed",
        chunksDeleted: 0,
      });

      const request = createMockRequest(
        "http://localhost:3000/api/documents/test.txt",
      );
      const response = await DELETE(request, createParams("test.txt"));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Delete failed");
    });

    it("should handle unexpected errors", async () => {
      const { deleteDocument } = await import("@/lib/mastra/index");
      vi.mocked(deleteDocument).mockRejectedValue(
        new Error("Unexpected error"),
      );

      const request = createMockRequest(
        "http://localhost:3000/api/documents/test.txt",
      );
      const response = await DELETE(request, createParams("test.txt"));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Unexpected error");
    });
  });

  describe("GET", () => {
    it("should return 400 when ID is missing", async () => {
      const request = createMockRequest("http://localhost:3000/api/documents/");
      const response = await GET(request, createParams(""));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Document ID is required");
    });

    it("should handle download action", async () => {
      const { getDocumentContent } = await import("@/lib/mastra/vectorstore");
      vi.mocked(getDocumentContent).mockResolvedValue("Document text content");

      const request = createMockRequest(
        "http://localhost:3000/api/documents/test.txt?action=download",
      );
      const response = await GET(request, createParams("test.txt"));

      expect(response.headers.get("Content-Type")).toBe("text/plain");
      expect(response.headers.get("Content-Disposition")).toContain(
        "attachment",
      );
    });

    it("should return 404 for download when document not found", async () => {
      const { getDocumentContent } = await import("@/lib/mastra/vectorstore");
      vi.mocked(getDocumentContent).mockResolvedValue(null);

      const request = createMockRequest(
        "http://localhost:3000/api/documents/unknown.txt?action=download",
      );
      const response = await GET(request, createParams("unknown.txt"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Document not found");
    });

    it("should return document info for non-download GET", async () => {
      const { getCollectionStats } = await import("@/lib/mastra/vectorstore");
      vi.mocked(getCollectionStats).mockResolvedValue({
        exists: true,
        collectionName: "documents",
        count: 5,
        documentCount: 2,
      });

      const request = createMockRequest(
        "http://localhost:3000/api/documents/test.txt",
      );
      const response = await GET(request, createParams("test.txt"));
      const data = await response.json();

      expect(data.id).toBe("test.txt");
      expect(data.exists).toBe(true);
    });

    it("should handle errors", async () => {
      const { getCollectionStats } = await import("@/lib/mastra/vectorstore");
      vi.mocked(getCollectionStats).mockRejectedValue(new Error("Failed"));

      const request = createMockRequest(
        "http://localhost:3000/api/documents/test.txt",
      );
      const response = await GET(request, createParams("test.txt"));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to retrieve document information");
    });
  });
});
