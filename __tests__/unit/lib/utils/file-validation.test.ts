import { describe, it, expect } from "vitest";
import { getFileType } from "@/lib/mastra/loaders";

describe("getFileType (from loaders)", () => {
  it("should return correct file type for supported extensions", () => {
    expect(getFileType("test.pdf")).toBe("pdf");
    expect(getFileType("test.txt")).toBe("txt");
    expect(getFileType("test.md")).toBe("md");
    expect(getFileType("test.markdown")).toBe("md");
    expect(getFileType("test.docx")).toBe("docx");
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
    expect(getFileType("test.PDF")).toBe("pdf");
    expect(getFileType("test.TXT")).toBe("txt");
    expect(getFileType("test.DOCX")).toBe("docx");
  });
});
