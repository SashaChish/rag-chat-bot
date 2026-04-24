import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";
import { POST, GET } from "@/app/api/chat/route";

vi.mock("@/lib/mastra/index", () => ({
  executeQuery: vi.fn(),
}));

vi.mock("@/lib/mastra/vectorstore", () => ({
  hasDocuments: vi.fn(),
}));

const createMockRequest = (body: unknown): NextRequest => {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
};

describe("/api/chat", () => {
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

  describe("POST", () => {
    it("should return 400 when message is missing", async () => {
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when message is empty", async () => {
      const request = createMockRequest({ message: "" });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return message when no documents exist", async () => {
      const { hasDocuments } = await import("@/lib/mastra/vectorstore");
      vi.mocked(hasDocuments).mockResolvedValue(false);

      const request = createMockRequest({ message: "Hello" });

      const response = await POST(request);
      const data = await response.json();

      expect(data.response).toContain("upload some documents");
      expect(data.sources).toEqual([]);
    });

    it("should execute query with valid request", async () => {
      const { hasDocuments } = await import("@/lib/mastra/vectorstore");
      const { executeQuery } = await import("@/lib/mastra/index");

      vi.mocked(hasDocuments).mockResolvedValue(true);
      vi.mocked(executeQuery).mockResolvedValue({
        response: "This is the answer",
        sources: [],
        streaming: false,
      });

      const request = createMockRequest({
        message: "What is this about?",
        chatEngineType: "condense",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.response).toBe("This is the answer");
      expect(executeQuery).toHaveBeenCalledWith(
        "What is this about?",
        false,
        [],
        "condense",
        null,
        null,
      );
    });

    it("should pass conversation history to query", async () => {
      const { hasDocuments } = await import("@/lib/mastra/vectorstore");
      const { executeQuery } = await import("@/lib/mastra/index");

      vi.mocked(hasDocuments).mockResolvedValue(true);
      vi.mocked(executeQuery).mockResolvedValue({
        response: "Answer",
        sources: [],
        streaming: false,
      });

      const history = [
        { role: "user" as const, content: "Previous question" },
        { role: "assistant" as const, content: "Previous answer" },
      ];

      const request = createMockRequest({
        message: "Follow up",
        conversationHistory: history,
      });

      await POST(request);

      expect(executeQuery).toHaveBeenCalledWith(
        "Follow up",
        false,
        history,
        "condense",
        null,
        null,
      );
    });

    it("should handle query errors", async () => {
      const { hasDocuments } = await import("@/lib/mastra/vectorstore");
      const { executeQuery } = await import("@/lib/mastra/index");

      vi.mocked(hasDocuments).mockResolvedValue(true);
      vi.mocked(executeQuery).mockResolvedValue({
        response: "",
        sources: [],
        streaming: false,
        error: "Query failed",
      });

      const request = createMockRequest({
        message: "Hello",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("QUERY_FAILED");
    });

    it("should handle streaming request", async () => {
      const { hasDocuments } = await import("@/lib/mastra/vectorstore");
      const { executeQuery } = await import("@/lib/mastra/index");

      vi.mocked(hasDocuments).mockResolvedValue(true);

      async function* mockGenerator() {
        yield { delta: "Hello" };
        yield { delta: " world" };
        yield { done: true, sources: [] };
      }

      vi.mocked(executeQuery).mockResolvedValue({
        response: mockGenerator(),
        sources: [],
        streaming: true,
      });

      const request = createMockRequest({
        message: "Hello",
        streaming: true,
      });

      const response = await POST(request);

      expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    });

    it("should handle unexpected errors", async () => {
      const request = {
        json: vi.fn().mockRejectedValue(new Error("Parse error")),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("GET", () => {
    it("should return ready status when documents exist", async () => {
      const { hasDocuments } = await import("@/lib/mastra/vectorstore");
      vi.mocked(hasDocuments).mockResolvedValue(true);

      const response = await GET({} as NextRequest);
      const data = await response.json();

      expect(data.ready).toBe(true);
      expect(data.message).toBe("Ready to answer questions");
    });

    it("should return not ready status when no documents", async () => {
      const { hasDocuments } = await import("@/lib/mastra/vectorstore");
      vi.mocked(hasDocuments).mockResolvedValue(false);

      const response = await GET({} as NextRequest);
      const data = await response.json();

      expect(data.ready).toBe(false);
      expect(data.message).toBe("Please upload documents first");
    });

    it("should handle errors", async () => {
      const { hasDocuments } = await import("@/lib/mastra/vectorstore");
      vi.mocked(hasDocuments).mockRejectedValue(new Error("Check failed"));

      const response = await GET({} as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("INTERNAL_ERROR");
    });
  });
});
