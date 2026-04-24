import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/mastra/vectorstore", () => ({
  getDocumentContent: vi.fn(),
}));

const createParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/api/documents/[id]/preview", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return document content", async () => {
    const { getDocumentContent } = await import("@/lib/mastra/vectorstore");
    vi.mocked(getDocumentContent).mockResolvedValue("Document text content");

    const { GET } = await import("@/app/api/documents/[id]/preview/route");
    const response = await GET({} as NextRequest, createParams("test.txt"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.content).toBe("Document text content");
    expect(getDocumentContent).toHaveBeenCalledWith("test.txt");
  });

  it("should return 404 when document not found", async () => {
    const { getDocumentContent } = await import("@/lib/mastra/vectorstore");
    vi.mocked(getDocumentContent).mockResolvedValue(null);

    const { GET } = await import("@/app/api/documents/[id]/preview/route");
    const response = await GET({} as NextRequest, createParams("missing.txt"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe("NOT_FOUND");
  });
});
