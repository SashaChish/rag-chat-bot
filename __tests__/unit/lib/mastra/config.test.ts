import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@mastra/core/llm", () => ({
  ModelRouterEmbeddingModel: vi.fn().mockImplementation(() => ({
    modelId: "openai/text-embedding-3-small",
  })),
}));

describe("config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe("getModelString", () => {
    it("should return openai default model", async () => {
      process.env.LLM_PROVIDER = "openai";
      delete process.env.LLM_MODEL;

      const { getModelString } = await import("@/lib/mastra/config");
      expect(getModelString()).toBe("openai/gpt-4o-mini");
    });

    it("should return anthropic default model", async () => {
      process.env.LLM_PROVIDER = "anthropic";
      delete process.env.LLM_MODEL;

      const { getModelString } = await import("@/lib/mastra/config");
      expect(getModelString()).toBe("anthropic/claude-sonnet-4-20250514");
    });

    it("should return groq default model", async () => {
      process.env.LLM_PROVIDER = "groq";
      delete process.env.LLM_MODEL;

      const { getModelString } = await import("@/lib/mastra/config");
      expect(getModelString()).toBe("groq/llama-3.3-70b-versatile");
    });

    it("should return ollama default model", async () => {
      process.env.LLM_PROVIDER = "ollama";
      delete process.env.LLM_MODEL;

      const { getModelString } = await import("@/lib/mastra/config");
      expect(getModelString()).toBe("ollama/llama3.2");
    });

    it("should use LLM_MODEL env var when set", async () => {
      process.env.LLM_PROVIDER = "openai";
      process.env.LLM_MODEL = "gpt-4o";

      const { getModelString } = await import("@/lib/mastra/config");
      expect(getModelString()).toBe("openai/gpt-4o");
    });

    it("should default to openai when LLM_PROVIDER not set", async () => {
      delete process.env.LLM_PROVIDER;
      delete process.env.LLM_MODEL;

      const { getModelString } = await import("@/lib/mastra/config");
      expect(getModelString()).toBe("openai/gpt-4o-mini");
    });
  });

  describe("getEmbeddingModel", () => {
    it("should return a ModelRouterEmbeddingModel instance", async () => {
      const { getEmbeddingModel } = await import("@/lib/mastra/config");
      const model = getEmbeddingModel();
      expect(model).toBeDefined();
    });
  });

});
