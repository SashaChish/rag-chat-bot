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

  describe("getDefaultInstructions", () => {
    it("should include CHROMA_PROMPT", async () => {
      const { getDefaultInstructions } = await import("@/lib/mastra/prompts");
      const instructions = getDefaultInstructions();
      expect(instructions).toContain("Chroma filter instructions");
    });

    it("should include base instructions", async () => {
      const { getDefaultInstructions, BASE_INSTRUCTIONS } =
        await import("@/lib/mastra/prompts");
      const instructions = getDefaultInstructions();
      expect(instructions).toContain(BASE_INSTRUCTIONS);
    });
  });
});
