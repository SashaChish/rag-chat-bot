import { describe, it, expect } from "vitest";
import { getFileType } from "@/lib/llamaindex/loaders";

describe("getFileType (from loaders)", () => {
  it("should return correct file type for supported extensions", () => {
    expect(getFileType("test.pdf")).toBe("PDF");
    expect(getFileType("test.txt")).toBe("TEXT");
    expect(getFileType("test.md")).toBe("MARKDOWN");
    expect(getFileType("test.markdown")).toBe("MARKDOWN");
    expect(getFileType("test.docx")).toBe("DOCX");
  });

  it("should return null for unsupported extensions", () => {
    expect(getFileType("test.jpg")).toBe(null);
    expect(getFileType("test.png")).toBe(null);
    expect(getFileType("test.exe")).toBe(null);
  });

  it("should return null for files with no extension", () => {
    expect(getFileType("testfile")).toBe(null);
  });

  it("should handle case insensitive extensions", () => {
    expect(getFileType("test.PDF")).toBe("PDF");
    expect(getFileType("test.TXT")).toBe("TEXT");
    expect(getFileType("test.DOCX")).toBe("DOCX");
  });
});
