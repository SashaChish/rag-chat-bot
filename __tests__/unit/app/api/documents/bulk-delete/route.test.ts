import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

const mockSelectWhereFn = vi.fn().mockResolvedValue([]);
const mockFromFn = vi.fn().mockReturnValue({ where: mockSelectWhereFn });
const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });
const mockDeleteWhereFn = vi.fn().mockResolvedValue(undefined);
const mockDeleteFn = vi.fn().mockReturnValue({ where: mockDeleteWhereFn });

vi.mock("@/lib/mastra/vectorstore", () => ({
  deleteDocumentChunks: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: mockSelectFn,
    delete: mockDeleteFn,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  documentsTable: {
    id: "id",
    filename: "file_name",
  },
}));

const createMockRequest = (body: unknown): NextRequest => {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
};

describe("/api/documents/bulk-delete", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    mockSelectFn.mockReturnValue({ from: mockFromFn });
    mockFromFn.mockReturnValue({ where: mockSelectWhereFn });
    mockSelectWhereFn.mockResolvedValue([]);
    mockDeleteFn.mockReturnValue({ where: mockDeleteWhereFn });
    mockDeleteWhereFn.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should delete documents and return results", async () => {
    mockSelectWhereFn
      .mockResolvedValueOnce([{ id: "id-1" }])
      .mockResolvedValueOnce([{ id: "id-2" }]);

    const { deleteDocumentChunks } = await import("@/lib/mastra/vectorstore");
    vi.mocked(deleteDocumentChunks).mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/documents/bulk-delete/route");
    const request = createMockRequest({ fileNames: ["doc1.txt", "doc2.txt"] });
    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.results).toHaveLength(2);
    expect(data.results[0].deleted_id).toBe("id-1");
    expect(data.results[1].deleted_id).toBe("id-2");
  });

  it("should handle partial delete failures", async () => {
    mockSelectWhereFn
      .mockResolvedValueOnce([{ id: "id-1" }])
      .mockResolvedValueOnce([]);

    const { deleteDocumentChunks } = await import("@/lib/mastra/vectorstore");
    vi.mocked(deleteDocumentChunks).mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/documents/bulk-delete/route");
    const request = createMockRequest({ fileNames: ["doc1.txt", "doc2.txt"] });
    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.results[0].success).toBe(true);
    expect(data.results[1].success).toBe(false);
    expect(data.results[1].error).toBe("Document not found");
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
