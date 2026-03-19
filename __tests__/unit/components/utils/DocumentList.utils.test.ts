import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  getFileIcon,
  formatDocumentDate,
  formatChunkCount,
  hasPreviewContent,
  canDownload,
  sortDocumentsByDate,
} from "@/components/DocumentList/DocumentList.utils";
import type { DocumentData } from "@/components/DocumentList/DocumentList.types";

function createMockDocumentData(overrides: Partial<DocumentData> = {}): DocumentData {
  return {
    id: "test-id",
    file_name: "test.txt",
    file_type: "TEXT",
    upload_date: "2026-03-17T10:00:00Z",
    chunk_count: 1,
    can_download: true,
    ...overrides,
  };
}

describe("getFileIcon", () => {
  it("should return JSX element for PDF files", () => {
    const icon = getFileIcon("PDF");
    const { container } = render(icon);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("should return JSX element for TEXT files", () => {
    const icon = getFileIcon("TEXT");
    const { container } = render(icon);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("should return JSX element for MARKDOWN files", () => {
    const icon = getFileIcon("MARKDOWN");
    const { container } = render(icon);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("should return JSX element for DOCX files", () => {
    const icon = getFileIcon("DOCX");
    const { container } = render(icon);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("should return JSX element for unknown file types", () => {
    const icon = getFileIcon("UNKNOWN");
    const { container } = render(icon);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

describe("formatDocumentDate", () => {
  it("should format date string correctly", () => {
    const result = formatDocumentDate("2026-03-17T00:00:00Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should handle ISO date strings", () => {
    const result = formatDocumentDate("2026-03-17T10:30:00Z");
    expect(typeof result).toBe("string");
  });

  it("should handle different date formats", () => {
    const result1 = formatDocumentDate("2026-03-17");
    const result2 = formatDocumentDate("2026/03/17");
    expect(typeof result1).toBe("string");
    expect(typeof result2).toBe("string");
  });
});

describe("formatChunkCount", () => {
  it("should return singular form for single chunk", () => {
    expect(formatChunkCount(1)).toBe("1 chunk");
  });

  it("should return plural form for multiple chunks", () => {
    expect(formatChunkCount(0)).toBe("0 chunks");
    expect(formatChunkCount(2)).toBe("2 chunks");
    expect(formatChunkCount(5)).toBe("5 chunks");
    expect(formatChunkCount(100)).toBe("100 chunks");
  });

  it("should handle edge cases", () => {
    expect(formatChunkCount(-1)).toBe("-1 chunks");
  });
});

describe("hasPreviewContent", () => {
  it("should return true for documents with content", () => {
    const document = createMockDocumentData({ content: "Some content" });
    expect(hasPreviewContent(document)).toBe(true);
  });

  it("should return false for documents with empty content", () => {
    const document = createMockDocumentData({ content: "" });
    expect(hasPreviewContent(document)).toBe(false);
  });

  it("should return false for documents with whitespace-only content", () => {
    const document = createMockDocumentData({ content: "   " });
    expect(hasPreviewContent(document)).toBe(false);
  });
});

describe("canDownload", () => {
  it("should return true for downloadable documents", () => {
    const document = createMockDocumentData({ can_download: true });
    expect(canDownload(document)).toBe(true);
  });

  it("should return false for non-downloadable documents", () => {
    const document = createMockDocumentData({ can_download: false });
    expect(canDownload(document)).toBe(false);
  });
});

describe("sortDocumentsByDate", () => {
  it("should sort documents by upload date descending", () => {
    const documents: DocumentData[] = [
      createMockDocumentData({ id: "1", file_name: "doc1.txt", upload_date: "2026-03-15T10:00:00Z" }),
      createMockDocumentData({ id: "2", file_name: "doc2.txt", upload_date: "2026-03-17T10:00:00Z" }),
      createMockDocumentData({ id: "3", file_name: "doc3.txt", upload_date: "2026-03-16T10:00:00Z" }),
    ];

    const sorted = sortDocumentsByDate(documents);

    expect(sorted[0].id).toBe("2");
    expect(sorted[1].id).toBe("3");
    expect(sorted[2].id).toBe("1");
  });

  it("should not mutate original array", () => {
    const documents: DocumentData[] = [
      createMockDocumentData({ id: "1", file_name: "doc1.txt", upload_date: "2026-03-15T10:00:00Z" }),
      createMockDocumentData({ id: "2", file_name: "doc2.txt", upload_date: "2026-03-17T10:00:00Z" }),
    ];

    const originalOrder = documents.map((doc) => doc.id);
    sortDocumentsByDate(documents);

    expect(documents.map((doc) => doc.id)).toEqual(originalOrder);
  });

  it("should handle empty array", () => {
    const result = sortDocumentsByDate([]);
    expect(result).toEqual([]);
  });

  it("should handle single document", () => {
    const documents: DocumentData[] = [
      createMockDocumentData({ id: "1", file_name: "doc1.txt", upload_date: "2026-03-15T10:00:00Z" }),
    ];
    const result = sortDocumentsByDate(documents);

    expect(result).toEqual(documents);
  });

  it("should handle documents with same upload date", () => {
    const documents: DocumentData[] = [
      createMockDocumentData({ id: "1", file_name: "doc1.txt", upload_date: "2026-03-15T10:00:00Z" }),
      createMockDocumentData({ id: "2", file_name: "doc2.txt", upload_date: "2026-03-15T10:00:00Z" }),
      createMockDocumentData({ id: "3", file_name: "doc3.txt", upload_date: "2026-03-15T10:00:00Z" }),
    ];

    const sorted = sortDocumentsByDate(documents);

    expect(sorted.length).toBe(3);
    expect(sorted).toContainEqual(documents[0]);
    expect(sorted).toContainEqual(documents[1]);
    expect(sorted).toContainEqual(documents[2]);
  });
});
