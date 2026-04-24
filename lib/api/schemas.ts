import { z } from "zod";

export const chatRequestSchema = z.object({
  message: z.string().min(1, "Message is required"),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      }),
    )
    .optional(),
  streaming: z.boolean().optional(),
  chatEngineType: z.enum(["condense", "context"]).optional(),
  sessionKey: z.string().nullable().optional(),
  systemPrompt: z.string().nullable().optional(),
});

export const bulkDeleteRequestSchema = z.object({
  fileNames: z
    .array(z.string().min(1))
    .min(1, "At least one file name is required"),
});
