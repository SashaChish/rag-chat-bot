import { describe, it, expect } from "vitest";
import { getSystemPrompt, DEFAULT_SYSTEM_PROMPT } from "@/lib/mastra/prompts";

describe("prompts", () => {
  describe("DEFAULT_SYSTEM_PROMPT", () => {
    it("should contain RAG instructions", () => {
      expect(DEFAULT_SYSTEM_PROMPT).toContain("CONTEXT START");
      expect(DEFAULT_SYSTEM_PROMPT).toContain("CONTEXT END");
      expect(DEFAULT_SYSTEM_PROMPT).toContain("Citations");
      expect(DEFAULT_SYSTEM_PROMPT).toContain("context");
    });

    it("should be a non-empty string", () => {
      expect(DEFAULT_SYSTEM_PROMPT).toBeTruthy();
      expect(DEFAULT_SYSTEM_PROMPT.length).toBeGreaterThan(100);
    });
  });

  describe("getSystemPrompt", () => {
    it("should return default prompt when no options provided", () => {
      const result = getSystemPrompt();
      expect(result).toBe(DEFAULT_SYSTEM_PROMPT);
    });

    it("should return default prompt when customPrompt is undefined", () => {
      const result = getSystemPrompt({});
      expect(result).toBe(DEFAULT_SYSTEM_PROMPT);
    });

    it("should return custom prompt when provided", () => {
      const customPrompt = "You are a helpful assistant.";
      const result = getSystemPrompt({ customPrompt });
      expect(result).toBe(customPrompt);
    });
  });
});
