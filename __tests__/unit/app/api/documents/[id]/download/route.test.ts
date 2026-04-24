import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/mastra/vectorstore", () => ({
  getDocumentContent: vi.fn(),
}));

const createParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/api/documents/[id]/download", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return file as attachment", async () => {
    const { getDocumentContent } = await import("@/lib/mastra/vectorstore");
    vi.mocked(getDocumentContent).mockResolvedValue("Document text content");

    const { GET } = await import("@/app/api/documents/[id]/download/route");
    const response = await GET({} as NextRequest, createParams("test.txt"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/plain");
    expect(response.headers.get("Content-Disposition")).toContain(
      'attachment; filename="test.txt"',
    );
  });

  it("should return 404 when document not found", async () => {
    const { getDocumentContent } = await import("@/lib/mastra/vectorstore");
    vi.mocked(getDocumentContent).mockResolvedValue(null);

    const { GET } = await import("@/app/api/documents/[id]/download/route");
    const response = await GET({} as NextRequest, createParams("missing.txt"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe("NOT_FOUND");
  });
});
