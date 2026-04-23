import type {
  MastraQueryResult,
  SourceInfo,
  DocumentMetadata,
} from "../types/core.types";

export function extractSources(
  queryResults: MastraQueryResult[],
): SourceInfo[] {
  if (!queryResults || queryResults.length === 0) return [];

  return queryResults.map((result) => {
    const metadata = (result.metadata || {}) as Partial<DocumentMetadata>;
    const fileName =
      typeof metadata.file_name === "string" ? metadata.file_name : "Unknown";
    const fileType =
      typeof metadata.file_type === "string" ? metadata.file_type : "Unknown";
    const scoreValue = result.score ? parseFloat(result.score.toFixed(3)) : 0;
    const content = result.document || "";
    const preview = content
      ? content.substring(0, 200) + (content.length > 200 ? "..." : "")
      : "";

    return {
      filename: fileName,
      fileType,
      score: scoreValue,
      text: preview || undefined,
      metadata: metadata as DocumentMetadata,
    };
  });
}
