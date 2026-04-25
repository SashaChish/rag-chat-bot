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
      const result = validateFile(file);
      expect(result.isValid).toBe(true);
      expect(result.file).toBe(file);
    });

    it("should reject null input with ValidationError", async () => {
      const { validateFile } = await import("@/lib/mastra/loaders");
      try {
        validateFile(null);
        expect.unreachable("Should have thrown");
      } catch (error) {
        expect((error as Error).message).toBe("No file provided");
        expect((error as { code: string }).code).toBe("VALIDATION_ERROR");
      }
    });

    it("should reject oversized files with ValidationError", async () => {
      const { validateFile } = await import("@/lib/mastra/loaders");
      const bigFile = new File([new Uint8Array(11 * 1024 * 1024)], "big.pdf");
      try {
        validateFile(bigFile);
        expect.unreachable("Should have thrown");
      } catch (error) {
        expect((error as Error).message).toContain("exceeds maximum");
        expect((error as { code: string }).code).toBe("VALIDATION_ERROR");
      }
    });

    it("should reject unsupported formats with ValidationError", async () => {
      const { validateFile } = await import("@/lib/mastra/loaders");
      const file = new File(["content"], "image.png", { type: "image/png" });
      try {
        validateFile(file);
        expect.unreachable("Should have thrown");
      } catch (error) {
        expect((error as Error).message).toContain("Unsupported file format");
        expect((error as { code: string }).code).toBe("VALIDATION_ERROR");
      }
    });

    it("should reject empty files with ValidationError", async () => {
      const { validateFile } = await import("@/lib/mastra/loaders");
      const file = new File([], "empty.txt", { type: "text/plain" });
      try {
        validateFile(file);
        expect.unreachable("Should have thrown");
      } catch (error) {
        expect((error as Error).message).toContain("File is empty");
        expect((error as { code: string }).code).toBe("VALIDATION_ERROR");
      }
    });
  });

  describe("loadDocumentFromBuffer", () => {
    it("should parse PDF files", async () => {
      const { loadDocumentFromBuffer } = await import("@/lib/mastra/loaders");
      const buffer = Buffer.from("fake pdf content");
      const result = await loadDocumentFromBuffer(buffer, "test.pdf");

      expect(result.content).toBeTruthy();
      expect(result.fileType).toBe("pdf");
    });

    it("should parse DOCX files", async () => {
      const { loadDocumentFromBuffer } = await import("@/lib/mastra/loaders");
      const buffer = Buffer.from("fake docx content");
      const result = await loadDocumentFromBuffer(buffer, "test.docx");

      expect(result.content).toBe("Extracted DOCX text content");
      expect(result.fileType).toBe("docx");
    });

    it("should parse MD files as text", async () => {
      const { loadDocumentFromBuffer } = await import("@/lib/mastra/loaders");
      const buffer = Buffer.from("# Hello World\nThis is markdown.");
      const result = await loadDocumentFromBuffer(buffer, "test.md");

      expect(result.content).toContain("Hello World");
      expect(result.fileType).toBe("md");
    });

    it("should parse TXT files as text", async () => {
      const { loadDocumentFromBuffer } = await import("@/lib/mastra/loaders");
      const buffer = Buffer.from("Plain text content here.");
      const result = await loadDocumentFromBuffer(buffer, "test.txt");

      expect(result.content).toBe("Plain text content here.");
      expect(result.fileType).toBe("txt");
    });

    it("should throw ValidationError for missing filename extension", async () => {
      const { loadDocumentFromBuffer } = await import("@/lib/mastra/loaders");
      const buffer = Buffer.from("content");
      try {
        await loadDocumentFromBuffer(buffer, "noext");
        expect.unreachable("Should have thrown");
      } catch (error) {
        expect((error as { code: string }).code).toBe("VALIDATION_ERROR");
      }
    });

    it("should set filename", async () => {
      const { loadDocumentFromBuffer } = await import("@/lib/mastra/loaders");
      const buffer = Buffer.from("content");
      const result = await loadDocumentFromBuffer(buffer, "my-document.txt");

      expect(result.filename).toBe("my-document.txt");
    });

    it("should set uploadDate", async () => {
      const { loadDocumentFromBuffer } = await import("@/lib/mastra/loaders");
      const buffer = Buffer.from("content");
      const result = await loadDocumentFromBuffer(buffer, "test.txt");

      expect(result.uploadDate).toBeTruthy();
    });

    it("should throw ValidationError for unsupported file type", async () => {
      const { loadDocumentFromBuffer } = await import("@/lib/mastra/loaders");
      const buffer = Buffer.from("content");
      try {
        await loadDocumentFromBuffer(buffer, "test.xyz");
        expect.unreachable("Should have thrown");
      } catch (error) {
        expect((error as { code: string }).code).toBe("VALIDATION_ERROR");
      }
    });
  });
});
