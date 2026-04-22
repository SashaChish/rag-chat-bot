import { describe, it, expect } from "vitest";
import {
  getFileExtension,
  validateFileExtension,
  validateFileSize,
  formatFileSize,
  getUploadErrorMessage,
} from "@/components/Upload/Upload.utils";

describe("getFileExtension", () => {
  it("should extract file extension correctly", () => {
    expect(getFileExtension("test.pdf")).toBe("pdf");
    expect(getFileExtension("document.txt")).toBe("txt");
    expect(getFileExtension("notes.md")).toBe("md");
  });

  it("should return the last segment for files without extension dot", () => {
    expect(getFileExtension("README")).toBe("readme");
    expect(getFileExtension("testfile")).toBe("testfile");
  });

  it("should handle multiple dots in filename", () => {
    expect(getFileExtension("test.backup.txt")).toBe("txt");
    expect(getFileExtension("final.report.pdf")).toBe("pdf");
  });

  it("should handle uppercase extensions", () => {
    expect(getFileExtension("test.PDF")).toBe("pdf");
    expect(getFileExtension("document.TXT")).toBe("txt");
  });

  it("should handle mixed case extensions", () => {
    expect(getFileExtension("test.PdF")).toBe("pdf");
    expect(getFileExtension("document.TxT")).toBe("txt");
  });
});

describe("validateFileExtension", () => {
  it("should return true for supported extensions", () => {
    expect(validateFileExtension("test.pdf")).toBe(true);
    expect(validateFileExtension("test.txt")).toBe(true);
    expect(validateFileExtension("test.md")).toBe(true);
    expect(validateFileExtension("test.markdown")).toBe(true);
    expect(validateFileExtension("test.docx")).toBe(true);
  });

  it("should return false for unsupported extensions", () => {
    expect(validateFileExtension("test.jpg")).toBe(false);
    expect(validateFileExtension("test.png")).toBe(false);
    expect(validateFileExtension("test.exe")).toBe(false);
  });

  it("should return false for files without extension", () => {
    expect(validateFileExtension("testfile")).toBe(false);
    expect(validateFileExtension("README")).toBe(false);
  });

  it("should handle case insensitive extensions", () => {
    expect(validateFileExtension("test.PDF")).toBe(true);
    expect(validateFileExtension("test.Txt")).toBe(true);
  });

  it("should use provided format names for validation", () => {
    expect(validateFileExtension("test.pdf")).toBe(true);
    expect(validateFileExtension("test.txt")).toBe(false);
  });
});

describe("validateFileSize", () => {
  it("should return true for files within size limit", () => {
    const file = new File(["test"], "test.txt", { type: "text/plain" });
    expect(validateFileSize(file, 10)).toBe(true);
  });

  it("should return false for files exceeding size limit", () => {
    const largeContent = "x".repeat(11 * 1024 * 1024);
    const file = new File([largeContent], "large.txt", { type: "text/plain" });
    expect(validateFileSize(file, 10)).toBe(false);
  });

  it("should use default max size of 10MB", () => {
    const file = new File(["test"], "test.txt", { type: "text/plain" });
    expect(validateFileSize(file)).toBe(true);
  });

  it("should handle custom max size", () => {
    const content = "x".repeat(5 * 1024 * 1024);
    const file = new File([content], "test.txt", { type: "text/plain" });
    expect(validateFileSize(file, 1)).toBe(false);
  });
});

describe("formatFileSize", () => {
  it("should return 0 Bytes for zero size", () => {
    expect(formatFileSize(0)).toBe("0 Bytes");
  });

  it("should format bytes correctly", () => {
    expect(formatFileSize(512)).toBe("512 Bytes");
  });

  it("should format kilobytes correctly", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });

  it("should format megabytes correctly", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1 MB");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2 MB");
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });

  it("should format gigabytes correctly", () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
    expect(formatFileSize(2 * 1024 * 1024 * 1024)).toBe("2 GB");
  });

  it("should round to 2 decimal places", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(1560)).toBe("1.52 KB");
  });
});

describe("getUploadErrorMessage", () => {
  it("should return message from Error object", () => {
    const error = new Error("Upload failed");
    expect(getUploadErrorMessage(error)).toBe("Upload failed");
  });

  it("should return unknown error message for non-Error objects", () => {
    expect(getUploadErrorMessage("string error")).toBe(
      "Unknown error occurred",
    );
    expect(getUploadErrorMessage(123)).toBe("Unknown error occurred");
    expect(getUploadErrorMessage(null)).toBe("Unknown error occurred");
    expect(getUploadErrorMessage(undefined)).toBe("Unknown error occurred");
  });
});
