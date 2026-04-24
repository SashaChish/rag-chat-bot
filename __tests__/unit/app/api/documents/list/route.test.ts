import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/mastra/vectorstore", () => ({
  getAllDocuments: vi.fn().mockResolvedValue({
    documents: [
      {
        file_name: "doc1.txt",
        file_type: "txt",
        chunk_count: 3,
        upload_date: "2024-01-01T00:00:00Z",
        first_chunk_id: "chunk-1",
      },
    ],
    total_chunks: 3,
  }),
}));

describe("/api/documents/list", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return document list", async () => {
    const { GET } = await import("@/app/api/documents/list/route");
    const response = await GET({} as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.documents).toHaveLength(1);
    expect(data.documents[0].file_name).toBe("doc1.txt");
    expect(data.documents[0].id).toBe("doc1.txt");
  });

  it("should handle errors", async () => {
    const { getAllDocuments } = await import("@/lib/mastra/vectorstore");
    vi.mocked(getAllDocuments).mockRejectedValueOnce(new Error("Database error"));

    const { GET } = await import("@/app/api/documents/list/route");
    const response = await GET({} as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });
});
