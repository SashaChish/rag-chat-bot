import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  NotFoundError,
  errorResponse,
} from "@/lib/api/errors";

describe("errors", () => {
  describe("AppError", () => {
    it("should create error with code, message, and status code", () => {
      const error = new AppError("INTERNAL_ERROR", "Something went wrong", 500);
      expect(error.code).toBe("INTERNAL_ERROR");
      expect(error.message).toBe("Something went wrong");
      expect(error.statusCode).toBe(500);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe("ValidationError", () => {
    it("should create error with VALIDATION_ERROR code and 400 status", () => {
      const error = new ValidationError("Invalid input");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.message).toBe("Invalid input");
      expect(error.statusCode).toBe(400);
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe("NotFoundError", () => {
    it("should create error with NOT_FOUND code and 404 status", () => {
      const error = new NotFoundError("Not found");
      expect(error.code).toBe("NOT_FOUND");
      expect(error.message).toBe("Not found");
      expect(error.statusCode).toBe(404);
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe("errorResponse", () => {
    it("should handle AppError instances", () => {
      const error = new ValidationError("Bad request");
      const response = errorResponse(error);
      expect(response.status).toBe(400);
      return response.json().then((data) => {
        expect(data).toEqual({
          error: { code: "VALIDATION_ERROR", message: "Bad request" },
        });
      });
    });

    it("should handle NotFoundError", () => {
      const error = new NotFoundError("Document not found");
      const response = errorResponse(error);
      expect(response.status).toBe(404);
      return response.json().then((data) => {
        expect(data).toEqual({
          error: { code: "NOT_FOUND", message: "Document not found" },
        });
      });
    });

    it("should handle unknown errors with 500 status", () => {
      const response = errorResponse(new Error("Something broke"));
      expect(response.status).toBe(500);
      return response.json().then((data) => {
        expect(data.error.code).toBe("INTERNAL_ERROR");
        expect(data.error.message).toBe("An unexpected error occurred");
      });
    });

    it("should handle string errors", () => {
      const response = errorResponse("string error");
      expect(response.status).toBe(500);
      return response.json().then((data) => {
        expect(data.error.code).toBe("INTERNAL_ERROR");
      });
    });
  });
});
