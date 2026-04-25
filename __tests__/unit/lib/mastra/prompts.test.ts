import { describe, it, expect, vi } from "vitest";

vi.mock("@mastra/chroma", () => ({
  CHROMA_PROMPT: "Chroma filter instructions for metadata filtering",
}));

describe("prompts", () => {
  describe("BASE_INSTRUCTIONS", () => {
    it("should contain tool-aware RAG instructions", async () => {
      const { BASE_INSTRUCTIONS } = await import("@/lib/mastra/prompts");
      expect(BASE_INSTRUCTIONS).toContain("vector query tool");
      expect(BASE_INSTRUCTIONS).toContain("Cite sources");
    });

    it("should be a non-empty string", async () => {
      const { BASE_INSTRUCTIONS } = await import("@/lib/mastra/prompts");
      expect(BASE_INSTRUCTIONS).toBeTruthy();
      expect(BASE_INSTRUCTIONS.length).toBeGreaterThan(100);
    });
  });
});
