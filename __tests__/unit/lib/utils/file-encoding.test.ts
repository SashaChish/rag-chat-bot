import { describe, it, expect } from "vitest";
import { getFileExtension } from "@/lib/utils/file-encoding/encoding.utils";

describe("getFileExtension", () => {
  it("should return correct extension for files with extension", () => {
    expect(getFileExtension("test.pdf")).toBe("pdf");
    expect(getFileExtension("document.txt")).toBe("txt");
    expect(getFileExtension("notes.md")).toBe("md");
    expect(getFileExtension("report.docx")).toBe("docx");
  });

  it("should return the last segment for files without extension dot", () => {
    expect(getFileExtension("testfile")).toBe("testfile");
    expect(getFileExtension("README")).toBe("readme");
    expect(getFileExtension("no_extension")).toBe("no_extension");
  });

  it("should handle multiple dots in filename", () => {
    expect(getFileExtension("test.backup.txt")).toBe("txt");
    expect(getFileExtension("final.report.pdf")).toBe("pdf");
    expect(getFileExtension("archive.tar.gz")).toBe("gz");
  });

  it("should handle uppercase extensions", () => {
    expect(getFileExtension("test.PDF")).toBe("pdf");
    expect(getFileExtension("document.TXT")).toBe("txt");
    expect(getFileExtension("notes.MD")).toBe("md");
  });

  it("should handle mixed case extensions", () => {
    expect(getFileExtension("test.PdF")).toBe("pdf");
    expect(getFileExtension("document.TxT")).toBe("txt");
    expect(getFileExtension("notes.Md")).toBe("md");
  });

  it("should handle files ending with dot", () => {
    expect(getFileExtension("testfile.")).toBe("");
  });

  it("should handle hidden files (dot prefix)", () => {
    expect(getFileExtension(".gitignore")).toBe("gitignore");
    expect(getFileExtension(".env.example")).toBe("example");
  });
});
