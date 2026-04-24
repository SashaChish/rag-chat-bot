import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import { errorResponse } from "./errors";

export type RouteHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>;

export function withErrorHandler(
  handler: RouteHandler,
): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
