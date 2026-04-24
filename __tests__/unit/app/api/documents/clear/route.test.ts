import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/mastra/vectorstore", () => ({
  clearCollection: vi.fn(),
}));

describe("/api/documents/clear", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should clear all documents", async () => {
    const { clearCollection } = await import("@/lib/mastra/vectorstore");
    vi.mocked(clearCollection).mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/documents/clear/route");
    const response = await POST({} as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("All documents cleared successfully");
    expect(clearCollection).toHaveBeenCalled();
  });

  it("should handle errors", async () => {
    const { clearCollection } = await import("@/lib/mastra/vectorstore");
    vi.mocked(clearCollection).mockRejectedValue(new Error("Clear failed"));

    const { POST } = await import("@/app/api/documents/clear/route");
    const response = await POST({} as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });
});
