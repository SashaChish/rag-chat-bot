import { describe, it, expect } from "vitest";
import { extractSources } from "@/lib/mastra/sources";
import type { MastraQueryResult } from "@/lib/types/core.types";

describe("extractSources", () => {
  it("should return empty array for undefined results", () => {
    const result = extractSources(undefined as unknown as MastraQueryResult[]);
    expect(result).toEqual([]);
  });

  it("should return empty array for empty results", () => {
    const result = extractSources([]);
    expect(result).toEqual([]);
  });

  it("should extract sources from Mastra query results", () => {
    const queryResults: MastraQueryResult[] = [
      {
        id: "result-1",
        score: 0.95,
        metadata: { file_name: "test.pdf", file_type: "pdf", upload_date: "2026-04-01" },
        document: "This is a test document content for the query result.",
      },
    ];

    const result = extractSources(queryResults);

    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe("test.pdf");
    expect(result[0].fileType).toBe("pdf");
    expect(result[0].score).toBe(0.95);
    expect(result[0].text).toBeTruthy();
  });

  it("should handle results with no metadata", () => {
    const queryResults: MastraQueryResult[] = [
      {
        id: "result-1",
        score: 0.8,
      },
    ];

    const result = extractSources(queryResults);

    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe("Unknown");
    expect(result[0].fileType).toBe("Unknown");
    expect(result[0].score).toBe(0.8);
  });

  it("should round score to 3 decimal places", () => {
    const queryResults: MastraQueryResult[] = [
      {
        id: "result-1",
        score: 0.956789,
        metadata: { file_name: "test.pdf", file_type: "pdf" },
      },
    ];

    const result = extractSources(queryResults);
    expect(result[0].score).toBe(0.957);
  });

  it("should truncate long document text to 200 characters", () => {
    const longText = "A".repeat(300);
    const queryResults: MastraQueryResult[] = [
      {
        id: "result-1",
        score: 0.9,
        metadata: { file_name: "test.txt", file_type: "txt" },
        document: longText,
      },
    ];

    const result = extractSources(queryResults);
    expect(result[0].text).toBe("A".repeat(200) + "...");
  });

  it("should handle multiple results", () => {
    const queryResults: MastraQueryResult[] = [
      {
        id: "result-1",
        score: 0.9,
        metadata: { file_name: "doc1.pdf", file_type: "pdf" },
        document: "Content 1",
      },
      {
        id: "result-2",
        score: 0.8,
        metadata: { file_name: "doc2.txt", file_type: "txt" },
        document: "Content 2",
      },
    ];

    const result = extractSources(queryResults);
    expect(result).toHaveLength(2);
    expect(result[0].filename).toBe("doc1.pdf");
    expect(result[1].filename).toBe("doc2.txt");
  });

  it("should handle zero score", () => {
    const queryResults: MastraQueryResult[] = [
      {
        id: "result-1",
        score: 0,
        metadata: { file_name: "test.txt", file_type: "txt" },
      },
    ];

    const result = extractSources(queryResults);
    expect(result[0].score).toBe(0);
  });
});
