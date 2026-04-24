import type { ZodSchema } from "zod";
import { ValidationError } from "./errors";

export function validateBody<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const message = firstIssue?.message ?? "Validation failed";
    throw new ValidationError(message);
  }
  return result.data;
}
