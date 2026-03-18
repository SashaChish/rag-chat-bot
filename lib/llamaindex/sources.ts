import { MetadataMode } from "llamaindex";
import type { SourceInfo, SourceNode, DocumentMetadata } from "../types/core.types";

export function extractSources(
  sourceNodes: SourceNode[] | undefined,
): SourceInfo[] {
  if (!sourceNodes) return [];

  return sourceNodes.map(({ node, score }) => {
    const metadata = node.metadata as Partial<DocumentMetadata>;
    const fileName = metadata.file_name || "Unknown";
    const fileType = metadata.file_type || "Unknown";
    const scoreValue = score ? parseFloat(score.toFixed(3)) : 0;
    const content =
      typeof node.getContent === "function"
        ? node.getContent(MetadataMode.NONE)
        : "";
    const preview = content.substring(0, 200) + "...";

    return {
      filename: fileName,
      fileType,
      score: scoreValue,
      text: preview,
      metadata: metadata as DocumentMetadata,
    };
  });
}
