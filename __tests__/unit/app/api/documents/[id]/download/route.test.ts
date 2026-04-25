import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

const mockWhereFn = vi.fn().mockResolvedValue([]);
const mockFromFn = vi.fn().mockReturnValue({ where: mockWhereFn });
const mockSelectFn = vi.fn().mockReturnValue({ from: mockFromFn });

vi.mock("@/lib/db", () => ({
  db: {
    select: mockSelectFn,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  documentsTable: {
    file_name: "file_name",
    content: "content",
  },
}));

const createParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/api/documents/[id]/download", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    mockSelectFn.mockReturnValue({ from: mockFromFn });
    mockFromFn.mockReturnValue({ where: mockWhereFn });
    mockWhereFn.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return file as attachment", async () => {
    mockWhereFn.mockResolvedValue([{ content: "Document text content" }]);

    const { GET } = await import("@/app/api/documents/[id]/download/route");
    const response = await GET({} as NextRequest, createParams("test.txt"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/plain");
    expect(response.headers.get("Content-Disposition")).toContain(
      'attachment; filename="test.txt"',
    );
  });

  it("should return 404 when document not found", async () => {
    mockWhereFn.mockResolvedValue([]);

    const { GET } = await import("@/app/api/documents/[id]/download/route");
    const response = await GET({} as NextRequest, createParams("missing.txt"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe("NOT_FOUND");
  });
});
