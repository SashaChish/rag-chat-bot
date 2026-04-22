import { describe, it, expect } from "vitest";
import {
  getSystemPrompt,
  DEFAULT_SYSTEM_PROMPT,
} from "@/lib/llamaindex/prompts";

describe("getSystemPrompt", () => {
  it("should return default system prompt when no options provided", () => {
    const result = getSystemPrompt();
    expect(result).toBe(DEFAULT_SYSTEM_PROMPT);
  });

  it("should return default system prompt when options object is empty", () => {
    const result = getSystemPrompt({});
    expect(result).toBe(DEFAULT_SYSTEM_PROMPT);
  });

  it("should return custom prompt when provided in options", () => {
    const customPrompt = "You are a helpful assistant.";
    const result = getSystemPrompt({ customPrompt });
    expect(result).toBe(customPrompt);
  });

  it("should handle empty custom prompt string as falsy", () => {
    const result = getSystemPrompt({ customPrompt: "" });
    expect(result).toBe(DEFAULT_SYSTEM_PROMPT);
  });

  it("should return default prompt when custom prompt is undefined", () => {
    const result = getSystemPrompt({ customPrompt: undefined });
    expect(result).toBe(DEFAULT_SYSTEM_PROMPT);
  });
});

describe("getDefaultSystemPrompt", () => {
  it("should return a string with RAG instructions", () => {
    const prompt = DEFAULT_SYSTEM_PROMPT;
    expect(typeof prompt).toBe("string");
  });

  it("should contain context section placeholder", () => {
    const prompt = DEFAULT_SYSTEM_PROMPT;
    expect(prompt).toContain("{{context will be inserted here}}");
  });

  it("should contain instructions for answering questions", () => {
    const prompt = DEFAULT_SYSTEM_PROMPT;
    expect(prompt).toContain("Answer Questions");
  });

  it("should contain instructions for citations", () => {
    const prompt = DEFAULT_SYSTEM_PROMPT;
    expect(prompt).toContain("Citations");
  });

  it("should contain instructions for handling insufficient context", () => {
    const prompt = DEFAULT_SYSTEM_PROMPT;
    expect(prompt).toContain("When Context is Insufficient");
  });

  it("should contain answer style instructions", () => {
    const prompt = DEFAULT_SYSTEM_PROMPT;
    expect(prompt).toContain("Answer Style");
  });

  it("should contain uncertainty instructions", () => {
    const prompt = DEFAULT_SYSTEM_PROMPT;
    expect(prompt).toContain("Uncertainty");
  });

  it("should have consistent default prompt across calls", () => {
    const prompt1 = DEFAULT_SYSTEM_PROMPT;
    const prompt2 = DEFAULT_SYSTEM_PROMPT;
    expect(prompt1).toBe(prompt2);
  });
});
