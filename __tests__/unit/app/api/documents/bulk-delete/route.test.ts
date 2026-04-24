import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/mastra/vectorstore", () => ({
  deleteDocumentByName: vi.fn(),
}));

const createMockRequest = (body: unknown): NextRequest => {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
};

describe("/api/documents/bulk-delete", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should delete documents and return results", async () => {
    const { deleteDocumentByName } = await import("@/lib/mastra/vectorstore");
    vi.mocked(deleteDocumentByName)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2);

    const { POST } = await import("@/app/api/documents/bulk-delete/route");
    const request = createMockRequest({ fileNames: ["doc1.txt", "doc2.txt"] });
    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.total_deleted_chunks).toBe(5);
    expect(data.results).toHaveLength(2);
    expect(data.results[0].deleted_chunks).toBe(3);
    expect(data.results[1].deleted_chunks).toBe(2);
  });

  it("should handle partial delete failures", async () => {
    const { deleteDocumentByName } = await import("@/lib/mastra/vectorstore");
    vi.mocked(deleteDocumentByName)
      .mockResolvedValueOnce(3)
      .mockRejectedValueOnce(new Error("Delete failed"));

    const { POST } = await import("@/app/api/documents/bulk-delete/route");
    const request = createMockRequest({ fileNames: ["doc1.txt", "doc2.txt"] });
    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.results[0].success).toBe(true);
    expect(data.results[1].success).toBe(false);
    expect(data.results[1].error).toBe("Delete failed");
  });

  it("should return validation error for empty fileNames", async () => {
    const { POST } = await import("@/app/api/documents/bulk-delete/route");
    const request = createMockRequest({ fileNames: [] });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return validation error for missing fileNames", async () => {
    const { POST } = await import("@/app/api/documents/bulk-delete/route");
    const request = createMockRequest({});
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });
});
