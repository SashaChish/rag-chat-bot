import { ChromaVector } from "@mastra/chroma";
import type {
  ChromaDocumentSummary,
  IndexStats,
} from "../types/core.types";

const INDEX_NAME = "documents";

let vectorStoreInstance: ChromaVector | null = null;

function parseChromaUrl(): {
  host: string;
  port: number;
  ssl: boolean;
} {
  const url = process.env.CHROMA_URL || "http://localhost:8000";
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port) || (parsed.protocol === "https:" ? 443 : 8000),
    ssl: parsed.protocol === "https:",
  };
}

export function getVectorStore(): ChromaVector {
  if (!vectorStoreInstance) {
    const { host, port, ssl } = parseChromaUrl();
    vectorStoreInstance = new ChromaVector({
      id: INDEX_NAME,
      host,
      port,
      ssl,
      ...(process.env.CHROMA_API_KEY && {
        apiKey: process.env.CHROMA_API_KEY,
      }),
    });
  }
  return vectorStoreInstance;
}

export async function ensureIndex(dimension: number = 1536): Promise<void> {
  const store = getVectorStore();
  const indexes = await store.listIndexes();
  if (!indexes.includes(INDEX_NAME)) {
    await store.createIndex({ indexName: INDEX_NAME, dimension });
    return;
  }
  const stats = await store.describeIndex({ indexName: INDEX_NAME });
  if (stats.dimension !== dimension) {
    await store.deleteIndex({ indexName: INDEX_NAME });
    await store.createIndex({ indexName: INDEX_NAME, dimension });
  }
}

export async function hasDocuments(): Promise<boolean> {
  try {
    const store = getVectorStore();
    const indexes = await store.listIndexes();
    if (!indexes.includes(INDEX_NAME)) return false;

    const stats = await store.describeIndex({ indexName: INDEX_NAME });
    return stats.count > 0;
  } catch (error) {
    console.error("Error checking for documents:", error);
    return false;
  }
}

export async function getAllDocuments(): Promise<{
  documents: ChromaDocumentSummary[];
  total_chunks: number;
}> {
  try {
    const store = getVectorStore();
    const indexes = await store.listIndexes();
    if (!indexes.includes(INDEX_NAME)) {
      return { documents: [], total_chunks: 0 };
    }

    const stats = await store.describeIndex({ indexName: INDEX_NAME });
    if (stats.count === 0) {
      return { documents: [], total_chunks: 0 };
    }

    const results = await store.get({ indexName: INDEX_NAME });

    if (
      !results ||
      results.length === 0 ||
      !results[0].metadata
    ) {
      return { documents: [], total_chunks: 0 };
    }

    const documents: Record<string, ChromaDocumentSummary> = {};

    for (let i = 0; i < results.length; i++) {
      const metadata = results[i].metadata as Record<string, unknown> | undefined;
      if (!metadata) continue;

      const fileName =
        typeof metadata.file_name === "string" ? metadata.file_name : "unknown";

      if (!documents[fileName]) {
        documents[fileName] = {
          file_name: fileName,
          file_type:
            typeof metadata.file_type === "string"
              ? metadata.file_type
              : "unknown",
          chunk_count: 0,
          upload_date:
            typeof metadata.upload_date === "string"
              ? metadata.upload_date
              : null,
          first_chunk_id: results[i].id,
        };
      }

      documents[fileName].chunk_count++;
    }

    const documentList = Object.values(documents).sort((a, b) => {
      const dateA = a.upload_date ? new Date(a.upload_date).getTime() : 0;
      const dateB = b.upload_date ? new Date(b.upload_date).getTime() : 0;
      return dateB - dateA || a.file_name.localeCompare(b.file_name);
    });

    return {
      documents: documentList,
      total_chunks: results.length,
    };
  } catch (error) {
    console.error("Error getting all documents:", error);
    return { documents: [], total_chunks: 0 };
  }
}

export async function deleteDocumentByName(
  fileName: string,
): Promise<number> {
  try {
    const store = getVectorStore();
    await store.deleteVectors({
      indexName: INDEX_NAME,
      filter: { file_name: fileName },
    });

    const results = await store.get({
      indexName: INDEX_NAME,
      filter: { file_name: fileName },
    });

    return results.length === 0 ? 1 : 0;
  } catch (error) {
    console.error(`Error deleting document ${fileName}:`, error);
    throw new Error(`Failed to delete document: ${(error as Error).message}`);
  }
}

export async function getCollectionStats(
  collectionName: string = INDEX_NAME,
): Promise<IndexStats> {
  try {
    const store = getVectorStore();
    const indexes = await store.listIndexes();
    if (!indexes.includes(INDEX_NAME)) {
      return {
        exists: false,
        collectionName,
        count: 0,
        documentCount: 0,
      };
    }

    const stats = await store.describeIndex({ indexName: INDEX_NAME });
    const documents = await getAllDocuments();

    return {
      exists: true,
      collectionName,
      count: stats.count,
      documentCount: documents.documents.length,
    };
  } catch (_error) {
    return {
      exists: false,
      collectionName,
      count: 0,
      documentCount: 0,
    };
  }
}

export async function clearCollection(): Promise<void> {
  const store = getVectorStore();
  const indexes = await store.listIndexes();
  if (indexes.includes(INDEX_NAME)) {
    await store.deleteIndex({ indexName: INDEX_NAME });
  }
}

export async function getDocumentContent(
  fileName: string,
): Promise<string | null> {
  try {
    const store = getVectorStore();
    const results = await store.get({
      indexName: INDEX_NAME,
      filter: { file_name: fileName },
    });

    if (!results || results.length === 0) return null;

    return results
      .map((r) => r.document || "")
      .filter(Boolean)
      .join("\n\n");
  } catch (error) {
    console.error(`Error getting document content for ${fileName}:`, error);
    return null;
  }
}
