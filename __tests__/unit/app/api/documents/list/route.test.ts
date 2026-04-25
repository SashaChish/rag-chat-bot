import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

const mockGetAllDocuments = vi.fn().mockResolvedValue([
  {
    id: "doc1",
    filename: "doc1.txt",
    fileType: "TEXT",
    fileSize: 100,
    uploadDate: "2024-01-01T00:00:00Z",
    chunkCount: 3,
    content: null,
  },
]);

vi.mock("@/lib/db", () => ({}));
vi.mock("@/lib/db/schema", () => ({
  documentsTable: {},
}));
vi.mock("@/lib/db/utils", () => ({
  getAllDocuments: mockGetAllDocuments,
}));

describe("/api/documents/list", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetAllDocuments.mockResolvedValue([
      {
        id: "doc1",
        filename: "doc1.txt",
        fileType: "TEXT",
        fileSize: 100,
        uploadDate: "2024-01-01T00:00:00Z",
        chunkCount: 3,
        content: null,
      },
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return document list", async () => {
    const { GET } = await import("@/app/api/documents/route");
    const response = await GET({} as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("documents");
    expect(data.documents).toHaveLength(1);
    expect(data.documents[0].filename).toBe("doc1.txt");
  });
});
