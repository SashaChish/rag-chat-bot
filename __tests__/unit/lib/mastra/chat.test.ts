import { describe, it, expect } from "vitest";
import { convertToChatMessages } from "@/lib/mastra/chat";

describe("chat", () => {
  describe("convertToChatMessages", () => {
    it("should map user messages", () => {
      const result = convertToChatMessages([
        { role: "user" as const, content: "Hello" },
      ]);
      expect(result[0].role).toBe("user");
      expect(result[0].content).toBe("Hello");
    });

    it("should map assistant messages", () => {
      const result = convertToChatMessages([
        { role: "assistant" as const, content: "Hi there" },
      ]);
      expect(result[0].role).toBe("assistant");
      expect(result[0].content).toBe("Hi there");
    });

    it("should map system messages", () => {
      const result = convertToChatMessages([
        { role: "system" as const, content: "You are helpful" },
      ]);
      expect(result[0].role).toBe("system");
      expect(result[0].content).toBe("You are helpful");
    });

    it("should map ai role to assistant", () => {
      const result = convertToChatMessages([
        { role: "ai" as unknown as "assistant", content: "Response" },
      ]);
      expect(result[0].role).toBe("assistant");
    });

    it("should map human role to user", () => {
      const result = convertToChatMessages([
        { role: "human" as unknown as "user", content: "Question" },
      ]);
      expect(result[0].role).toBe("user");
    });

    it("should handle empty history", () => {
      const result = convertToChatMessages([]);
      expect(result).toEqual([]);
    });

    it("should handle mixed conversation", () => {
      const result = convertToChatMessages([
        { role: "user" as const, content: "What is RAG?" },
        { role: "assistant" as const, content: "RAG stands for..." },
        { role: "user" as const, content: "Tell me more" },
      ]);

      expect(result).toHaveLength(3);
      expect(result[0].role).toBe("user");
      expect(result[1].role).toBe("assistant");
      expect(result[2].role).toBe("user");
    });
  });
});
