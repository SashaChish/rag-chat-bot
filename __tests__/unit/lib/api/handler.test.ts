import { describe, it, expect, vi } from "vitest";
import type { NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import { NextResponse } from "next/server";
import { ValidationError, NotFoundError } from "@/lib/api/errors";

describe("withErrorHandler", () => {
  const createMockRequest = (): NextRequest =>
    ({ url: "http://localhost:3000/api/test" }) as NextRequest;

  it("should pass through successful responses", async () => {
    const handler = vi.fn().mockResolvedValue(
      NextResponse.json({ success: true }),
    );

    const wrapped = withErrorHandler(handler);
    const response = await wrapped(createMockRequest());

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it("should catch ValidationError and return 400", async () => {
    const handler = vi.fn().mockRejectedValue(
      new ValidationError("Invalid input"),
    );

    const wrapped = withErrorHandler(handler);
    const response = await wrapped(createMockRequest());

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe("VALIDATION_ERROR");
    expect(data.error.message).toBe("Invalid input");
  });

  it("should catch NotFoundError and return 404", async () => {
    const handler = vi.fn().mockRejectedValue(
      new NotFoundError("Not found"),
    );

    const wrapped = withErrorHandler(handler);
    const response = await wrapped(createMockRequest());

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error.code).toBe("NOT_FOUND");
  });

  it("should catch unknown errors and return 500", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("Unexpected"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const wrapped = withErrorHandler(handler);
    const response = await wrapped(createMockRequest());

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });
});
