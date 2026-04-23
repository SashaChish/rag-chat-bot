import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

class MockPDFParse {
  private data: Buffer;
  constructor({ data }: { data: Buffer }) {
    this.data = data;
  }
  async getText() {
    return {
      text: this.data.length > 0 ? "Extracted PDF text content" : "",
    };
  }
}

vi.mock("pdf-parse", () => ({
  PDFParse: MockPDFParse,
}));

vi.mock("mammoth", () => ({
  extractRawText: vi.fn().mockResolvedValue({
    value: "Extracted DOCX text content",
  }),
}));

describe("loaders", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe("getFileType", () => {
    it("should recognize pdf files", async () => {
      const { getFileType } = await import("@/lib/mastra/loaders");
      expect(getFileType("document.pdf")).toBe("pdf");
    });

    it("should recognize docx files", async () => {
      const { getFileType } = await import("@/lib/mastra/loaders");
      expect(getFileType("document.docx")).toBe("docx");
    });

    it("should recognize md files", async () => {
      const { getFileType } = await import("@/lib/mastra/loaders");
      expect(getFileType("readme.md")).toBe("md");
    });

    it("should recognize markdown files", async () => {
      const { getFileType } = await import("@/lib/mastra/loaders");
      expect(getFileType("readme.markdown")).toBe("md");
    });

    it("should recognize txt files", async () => {
      const { getFileType } = await import("@/lib/mastra/loaders");
      expect(getFileType("notes.txt")).toBe("txt");
    });

    it("should return null for unknown formats", async () => {
      const { getFileType } = await import("@/lib/mastra/loaders");
      expect(getFileType("image.png")).toBeNull();
    });

    it("should return null for files with no extension", async () => {
      const { getFileType } = await import("@/lib/mastra/loaders");
      expect(getFileType("noext")).toBeNull();
    });
  });

  describe("validateFile", () => {
    it("should accept valid files under 10MB", async () => {
      const { validateFile } = await import("@/lib/mastra/loaders");
      const file = new File(["content"], "test.txt", { type: "text/plain" });
      expect(validateFile(file)).toBe(true);
    });

    it("should reject oversized files", async () => {
      const { validateFile } = await import("@/lib/mastra/loaders");
      const bigFile = {
        name: "big.pdf",
        size: 11 * 1024 * 1024,
      } as File;
      expect(() => validateFile(bigFile)).toThrow("exceeds maximum");
    });

    it("should reject unsupported formats", async () => {
      const { validateFile } = await import("@/lib/mastra/loaders");
      const file = {
        name: "image.png",
        size: 100,
      } as File;
      expect(() => validateFile(file)).toThrow("Unsupported file format");
    });

    it("should reject empty files", async () => {
      const { validateFile } = await import("@/lib/mastra/loaders");
      const file = {
        name: "empty.txt",
        size: 0,
      } as File;
      expect(() => validateFile(file)).toThrow("File is empty");
    });
  });

  describe("loadDocumentFromBuffer", () => {
    it("should parse PDF files", async () => {
      const { loadDocumentFromBuffer } = await import("@/lib/mastra/loaders");
      const buffer = Buffer.from("fake pdf content");
      const result = await loadDocumentFromBuffer(buffer, "test.pdf");

      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].metadata.file_type).toBe("pdf");
    });

    it("should parse DOCX files", async () => {
      const { loadDocumentFromBuffer } = await import("@/lib/mastra/loaders");
      const buffer = Buffer.from("fake docx content");
      const result = await loadDocumentFromBuffer(buffer, "test.docx");

      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].text).toBe("Extracted DOCX text content");
      expect(result.documents[0].metadata.file_type).toBe("docx");
    });

    it("should parse MD files as text", async () => {
      const { loadDocumentFromBuffer } = await import("@/lib/mastra/loaders");
      const buffer = Buffer.from("# Hello World\nThis is markdown.");
      const result = await loadDocumentFromBuffer(buffer, "test.md");

      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].text).toContain("Hello World");
      expect(result.documents[0].metadata.file_type).toBe("md");
    });

    it("should parse TXT files as text", async () => {
      const { loadDocumentFromBuffer } = await import("@/lib/mastra/loaders");
      const buffer = Buffer.from("Plain text content here.");
      const result = await loadDocumentFromBuffer(buffer, "test.txt");

      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].text).toBe("Plain text content here.");
      expect(result.documents[0].metadata.file_type).toBe("txt");
    });

    it("should throw error for empty buffer", async () => {
      const { loadDocumentFromBuffer } = await import("@/lib/mastra/loaders");
      const buffer = Buffer.alloc(0);
      await expect(
        loadDocumentFromBuffer(buffer, "test.txt"),
      ).rejects.toThrow("File is empty");
    });

    it("should throw error for missing filename extension", async () => {
      const { loadDocumentFromBuffer } = await import("@/lib/mastra/loaders");
      const buffer = Buffer.from("content");
      await expect(
        loadDocumentFromBuffer(buffer, "noext"),
      ).rejects.toThrow();
    });

    it("should set file_name metadata", async () => {
      const { loadDocumentFromBuffer } = await import("@/lib/mastra/loaders");
      const buffer = Buffer.from("content");
      const result = await loadDocumentFromBuffer(buffer, "my-document.txt");

      expect(result.documents[0].metadata.file_name).toBe("my-document.txt");
    });

    it("should set upload_date metadata", async () => {
      const { loadDocumentFromBuffer } = await import("@/lib/mastra/loaders");
      const buffer = Buffer.from("content");
      const result = await loadDocumentFromBuffer(buffer, "test.txt");

      expect(result.documents[0].metadata.upload_date).toBeTruthy();
    });
  });
});
