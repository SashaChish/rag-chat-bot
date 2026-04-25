import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/mastra/vectorstore", () => ({
  deleteDocumentChunks: vi.fn(),
}));

vi.mock("@/lib/db/utils", () => ({
  deleteDocument: vi.fn(),
  getDocument: vi.fn(),
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
      const { deleteDocumentChunks } = await import(
        "@/lib/mastra/vectorstore"
      );
      const { deleteDocument } = await import("@/lib/db/utils");
      vi.mocked(deleteDocument).mockResolvedValue({ rows: [] } as never);
      vi.mocked(deleteDocumentChunks).mockResolvedValue(undefined);

      const { DELETE } = await import(
        "@/app/api/documents/[id]/route"
      );
      const request = {} as NextRequest;
      const response = await DELETE(request, createParams("test-id"));
      const data = await response.json();

      expect(data.id).toBe("test-id");
      expect(data.message).toBe("Document deleted successfully");
      expect(deleteDocument).toHaveBeenCalledWith("test-id");
      expect(deleteDocumentChunks).toHaveBeenCalledWith("test-id");
    });

    it("should handle unexpected errors", async () => {
      const { deleteDocumentChunks } = await import(
        "@/lib/mastra/vectorstore"
      );
      const { deleteDocument } = await import("@/lib/db/utils");
      vi.mocked(deleteDocument).mockRejectedValue(
        new Error("Unexpected error") as never,
      );
      vi.mocked(deleteDocumentChunks).mockResolvedValue(undefined);

      const { DELETE } = await import(
        "@/app/api/documents/[id]/route"
      );
      const request = {} as NextRequest;
      const response = await DELETE(request, createParams("test-id"));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("GET", () => {
    it("should return document by id", async () => {
      const { getDocument } = await import("@/lib/db/utils");
      vi.mocked(getDocument).mockResolvedValue([
        {
          id: "doc-1",
          filename: "test.txt",
          fileType: "TEXT",
          fileSize: 1024,
          uploadDate: "2024-01-01T00:00:00Z",
          chunkCount: 5,
          content: "Hello world",
        },
      ] as never);

      const { GET } = await import("@/app/api/documents/[id]/route");
      const request = {} as NextRequest;
      const response = await GET(request, createParams("doc-1"));
      const data = await response.json();

      expect(data.id).toBe("doc-1");
      expect(data.filename).toBe("test.txt");
      expect(data.chunkCount).toBe(5);
      expect(data.content).toBe("Hello world");
      expect(getDocument).toHaveBeenCalledWith("doc-1");
    });

    it("should handle missing document", async () => {
      const { getDocument } = await import("@/lib/db/utils");
      vi.mocked(getDocument).mockResolvedValue([] as never);

      const { GET } = await import("@/app/api/documents/[id]/route");
      const request = {} as NextRequest;
      const response = await GET(request, createParams("missing-id"));

      expect(response.status).toBe(500);
    });

    it("should handle errors", async () => {
      const { getDocument } = await import("@/lib/db/utils");
      vi.mocked(getDocument).mockRejectedValue(new Error("Failed"));

      const { GET } = await import("@/app/api/documents/[id]/route");
      const request = {} as NextRequest;
      const response = await GET(request, createParams("test-id"));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("INTERNAL_ERROR");
    });
  });
});
