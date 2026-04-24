import { NextResponse } from "next/server";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FORMAT"
  | "EMPTY_FILE"
  | "UPLOAD_FAILED"
  | "DELETE_FAILED"
  | "QUERY_FAILED"
  | "NO_DOCUMENTS"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;

  constructor(code: ErrorCode, message: string, statusCode: number = 500) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super("VALIDATION_ERROR", message, 400);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super("NOT_FOUND", message, 404);
    this.name = "NotFoundError";
  }
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.statusCode },
    );
  }

  console.error("Unhandled error:", error);

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR" satisfies ErrorCode,
        message: "An unexpected error occurred",
      },
    },
    { status: 500 },
  );
}
