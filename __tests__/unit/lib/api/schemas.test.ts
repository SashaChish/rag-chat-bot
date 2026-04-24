import { describe, it, expect } from "vitest";
import { chatRequestSchema, bulkDeleteRequestSchema } from "@/lib/api/schemas";

describe("schemas", () => {
  describe("chatRequestSchema", () => {
    it("should validate a minimal valid request", () => {
      const result = chatRequestSchema.safeParse({ message: "Hello" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe("Hello");
      }
    });

    it("should reject empty message", () => {
      const result = chatRequestSchema.safeParse({ message: "" });
      expect(result.success).toBe(false);
    });

    it("should reject missing message", () => {
      const result = chatRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should validate full request with all fields", () => {
      const result = chatRequestSchema.safeParse({
        message: "Hello",
        conversationHistory: [
          { role: "user", content: "Hi" },
          { role: "assistant", content: "Hello" },
        ],
        streaming: true,
        sessionKey: "session-1",
        systemPrompt: "Custom prompt",
      });
      expect(result.success).toBe(true);
    });

    it("should accept null sessionKey", () => {
      const result = chatRequestSchema.safeParse({
        message: "Hello",
        sessionKey: null,
      });
      expect(result.success).toBe(true);
    });

    it("should strip unknown fields", () => {
      const result = chatRequestSchema.safeParse({
        message: "Hello",
        chatEngineType: "condense",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect("chatEngineType" in result.data).toBe(false);
      }
    });
  });

  describe("bulkDeleteRequestSchema", () => {
    it("should validate valid fileNames array", () => {
      const result = bulkDeleteRequestSchema.safeParse({
        fileNames: ["doc1.txt", "doc2.pdf"],
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty fileNames array", () => {
      const result = bulkDeleteRequestSchema.safeParse({
        fileNames: [],
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing fileNames", () => {
      const result = bulkDeleteRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject empty strings in fileNames", () => {
      const result = bulkDeleteRequestSchema.safeParse({
        fileNames: ["doc.txt", ""],
      });
      expect(result.success).toBe(false);
    });
  });
});
