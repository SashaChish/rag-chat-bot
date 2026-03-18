import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";
import { DELETE, GET } from "@/app/api/documents/[id]/route";

vi.mock("@/lib/llamaindex/settings", () => ({
  initializeSettings: vi.fn(),
}));

vi.mock("@/lib/llamaindex/index", () => ({
  deleteDocument: vi.fn(),
}));

vi.mock("@/lib/llamaindex/vectorstore", () => ({
  getCollection: vi.fn(),
  getStorageContext: vi.fn(),
}));

const createMockRequest = (url: string): NextRequest => {
  return {
    url,
  } as unknown as NextRequest;
};

const createParams = (id: string) => ({ params: { id } });

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
      const { deleteDocument } = await import("@/lib/llamaindex/index");
      const { getStorageContext } =
        await import("@/lib/llamaindex/vectorstore");

      vi.mocked(deleteDocument).mockResolvedValue({
        success: true,
        chunksDeleted: 3,
      });

      vi.mocked(getStorageContext).mockResolvedValue({
        docStore: {
          getAllRefDocInfo: vi.fn().mockReturnValue({}),
        },
      } as unknown as Awaited<ReturnType<typeof getStorageContext>>);

      const request = createMockRequest(
        "http://localhost:3000/api/documents/test.txt",
      );
      const response = await DELETE(request, createParams("test.txt"));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toBe("Document deleted successfully");
    });

    it("should return error when delete fails", async () => {
      const { deleteDocument } = await import("@/lib/llamaindex/index");

      vi.mocked(deleteDocument).mockResolvedValue({
        success: false,
        error: "Delete failed",
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
      const { deleteDocument } = await import("@/lib/llamaindex/index");
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

    it("should delete from docStore when document found", async () => {
      const { deleteDocument } = await import("@/lib/llamaindex/index");
      const { getStorageContext } =
        await import("@/lib/llamaindex/vectorstore");

      vi.mocked(deleteDocument).mockResolvedValue({
        success: true,
        chunksDeleted: 3,
      });

      const mockDeleteDocument = vi.fn();
      vi.mocked(getStorageContext).mockResolvedValue({
        docStore: {
          getAllRefDocInfo: vi.fn().mockReturnValue({
            "doc-1": {},
          }),
          getDocument: vi.fn().mockResolvedValue({
            metadata: { file_name: "test.txt" },
          }),
          deleteDocument: mockDeleteDocument,
        },
      } as unknown as Awaited<ReturnType<typeof getStorageContext>>);

      const request = createMockRequest(
        "http://localhost:3000/api/documents/test.txt",
      );
      await DELETE(request, createParams("test.txt"));

      expect(mockDeleteDocument).toHaveBeenCalled();
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

    it("should return 404 when document not found", async () => {
      const { getCollection } = await import("@/lib/llamaindex/vectorstore");
      vi.mocked(getCollection).mockResolvedValue({
        get: vi.fn().mockResolvedValue({ metadatas: [], ids: [] }),
      } as unknown as Awaited<ReturnType<typeof getCollection>>);

      const request = createMockRequest(
        "http://localhost:3000/api/documents/unknown.txt",
      );
      const response = await GET(request, createParams("unknown.txt"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Document not found");
    });

    it("should return document info", async () => {
      const { getCollection } = await import("@/lib/llamaindex/vectorstore");
      vi.mocked(getCollection).mockResolvedValue({
        get: vi.fn().mockResolvedValue({
          metadatas: [
            {
              file_name: "test.txt",
              file_type: "TEXT",
              upload_date: "2024-01-01T00:00:00Z",
            },
          ],
          ids: ["chunk-1", "chunk-2"],
        }),
      } as unknown as Awaited<ReturnType<typeof getCollection>>);

      const request = createMockRequest(
        "http://localhost:3000/api/documents/test.txt",
      );
      const response = await GET(request, createParams("test.txt"));
      const data = await response.json();

      expect(data.id).toBe("test.txt");
      expect(data.file_name).toBe("test.txt");
      expect(data.chunk_count).toBe(2);
    });

    it("should handle download action", async () => {
      const { getStorageContext } =
        await import("@/lib/llamaindex/vectorstore");

      vi.mocked(getStorageContext).mockResolvedValue({
        docStore: {
          getAllRefDocInfo: vi.fn().mockReturnValue({
            "doc-1": {},
          }),
          getDocument: vi.fn().mockResolvedValue({
            metadata: {
              file_name: "test.txt",
              file_type: "text/plain",
              original_file_buffer: Buffer.from("content").toString("base64"),
            },
          }),
        },
      } as unknown as Awaited<ReturnType<typeof getStorageContext>>);

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
      const { getStorageContext } =
        await import("@/lib/llamaindex/vectorstore");

      vi.mocked(getStorageContext).mockResolvedValue({
        docStore: {
          getAllRefDocInfo: vi.fn().mockReturnValue({}),
          getDocument: vi.fn().mockResolvedValue(null),
        },
      } as unknown as Awaited<ReturnType<typeof getStorageContext>>);

      const request = createMockRequest(
        "http://localhost:3000/api/documents/unknown.txt?action=download",
      );
      const response = await GET(request, createParams("unknown.txt"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Document not found");
    });

    it("should handle errors", async () => {
      const { getCollection } = await import("@/lib/llamaindex/vectorstore");
      vi.mocked(getCollection).mockRejectedValue(new Error("Failed"));

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
