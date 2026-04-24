import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";
import { DELETE, GET } from "@/app/api/documents/[id]/route";

vi.mock("@/lib/mastra/vectorstore", () => ({
  deleteDocumentByName: vi.fn(),
  getDocumentStats: vi.fn(),
}));

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
    it("should delete document successfully", async () => {
      const { deleteDocumentByName } = await import("@/lib/mastra/vectorstore");
      vi.mocked(deleteDocumentByName).mockResolvedValue(3);

      const request = {} as NextRequest;
      const response = await DELETE(request, createParams("test.txt"));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toBe("Document deleted successfully");
      expect(deleteDocumentByName).toHaveBeenCalledWith("test.txt");
    });

    it("should handle unexpected errors", async () => {
      const { deleteDocumentByName } = await import("@/lib/mastra/vectorstore");
      vi.mocked(deleteDocumentByName).mockRejectedValue(
        new Error("Unexpected error"),
      );

      const request = {} as NextRequest;
      const response = await DELETE(request, createParams("test.txt"));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("GET", () => {
    it("should return document-specific stats", async () => {
      const { getDocumentStats } = await import("@/lib/mastra/vectorstore");
      vi.mocked(getDocumentStats).mockResolvedValue({
        exists: true,
        chunk_count: 5,
        file_type: "txt",
        upload_date: "2024-01-01T00:00:00Z",
      });

      const request = {} as NextRequest;
      const response = await GET(request, createParams("test.txt"));
      const data = await response.json();

      expect(data.id).toBe("test.txt");
      expect(data.exists).toBe(true);
      expect(data.chunk_count).toBe(5);
      expect(data.file_type).toBe("txt");
      expect(getDocumentStats).toHaveBeenCalledWith("test.txt");
    });

    it("should return not-exists for missing documents", async () => {
      const { getDocumentStats } = await import("@/lib/mastra/vectorstore");
      vi.mocked(getDocumentStats).mockResolvedValue({
        exists: false,
        chunk_count: 0,
        file_type: null,
        upload_date: null,
      });

      const request = {} as NextRequest;
      const response = await GET(request, createParams("missing.txt"));
      const data = await response.json();

      expect(data.id).toBe("missing.txt");
      expect(data.exists).toBe(false);
      expect(data.chunk_count).toBe(0);
    });

    it("should handle errors", async () => {
      const { getDocumentStats } = await import("@/lib/mastra/vectorstore");
      vi.mocked(getDocumentStats).mockRejectedValue(new Error("Failed"));

      const request = {} as NextRequest;
      const response = await GET(request, createParams("test.txt"));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("INTERNAL_ERROR");
    });
  });
});
