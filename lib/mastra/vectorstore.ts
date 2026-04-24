import { ChromaVector } from "@mastra/chroma";
import type { ChromaDocumentSummary, IndexStats } from "../types/core.types";

export const INDEX_NAME = "documents";

let vectorStoreInstance: ChromaVector | null = null;

function buildChromaConfig(): ConstructorParameters<typeof ChromaVector>[0] {
  const chromaUrl = process.env.CHROMA_URL as string;
  const parsed = new URL(chromaUrl);

  return {
    id: INDEX_NAME,
    host: parsed.hostname,
    port: parseInt(parsed.port) || (parsed.protocol === "https:" ? 443 : 8000),
    ssl: parsed.protocol === "https:",
    apiKey: process.env.CHROMA_API_KEY,
  };
}

export function getVectorStore(): ChromaVector {
  if (!vectorStoreInstance) {
    const config = buildChromaConfig();
    vectorStoreInstance = new ChromaVector(config ?? { id: INDEX_NAME });
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
    const stats = await store.describeIndex({ indexName: INDEX_NAME });
    return stats.count > 0;
  } catch {
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

    const results = await store.get({
      indexName: INDEX_NAME,
      limit: stats.count,
    });

    if (!results || results.length === 0 || !results[0].metadata) {
      return { documents: [], total_chunks: 0 };
    }

    const grouped = new Map<string, ChromaDocumentSummary>();

    for (const record of results) {
      const metadata = record.metadata as Record<string, unknown> | undefined;
      if (!metadata) continue;

      const fileName =
        typeof metadata.file_name === "string" ? metadata.file_name : "unknown";

      if (!grouped.has(fileName)) {
        grouped.set(fileName, {
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
          first_chunk_id: record.id,
        });
      }

      grouped.get(fileName)!.chunk_count++;
    }

    const documentList = Array.from(grouped.values()).sort((a, b) => {
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

export async function deleteDocumentByName(fileName: string): Promise<number> {
  try {
    const store = getVectorStore();

    const existing = await store.get({
      indexName: INDEX_NAME,
      filter: { file_name: fileName },
    });
    const chunkCount = existing?.length ?? 0;

    await store.deleteVectors({
      indexName: INDEX_NAME,
      filter: { file_name: fileName },
    });

    return chunkCount;
  } catch (error) {
    console.error(`Error deleting document ${fileName}:`, error);
    throw new Error(`Failed to delete document: ${(error as Error).message}`);
  }
}

export async function getDocumentStats(fileName: string): Promise<{
  exists: boolean;
  chunk_count: number;
  file_type: string | null;
  upload_date: string | null;
}> {
  try {
    const store = getVectorStore();
    const results = await store.get({
      indexName: INDEX_NAME,
      filter: { file_name: fileName },
    });

    if (!results || results.length === 0) {
      return {
        exists: false,
        chunk_count: 0,
        file_type: null,
        upload_date: null,
      };
    }

    const metadata = results[0].metadata as Record<string, unknown> | undefined;

    return {
      exists: true,
      chunk_count: results.length,
      file_type:
        metadata && typeof metadata.file_type === "string"
          ? metadata.file_type
          : null,
      upload_date:
        metadata && typeof metadata.upload_date === "string"
          ? metadata.upload_date
          : null,
    };
  } catch {
    return {
      exists: false,
      chunk_count: 0,
      file_type: null,
      upload_date: null,
    };
  }
}

async function getUniqueDocumentCount(
  store: ChromaVector,
  vectorCount: number,
): Promise<number> {
  const records = await store.get({
    indexName: INDEX_NAME,
    limit: vectorCount,
  });

  const fileNames = new Set<string>();
  for (const record of records) {
    const metadata = record.metadata as Record<string, unknown> | undefined;
    if (metadata && typeof metadata.file_name === "string") {
      fileNames.add(metadata.file_name);
    }
  }
  return fileNames.size;
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
    const documentCount =
      stats.count > 0 ? await getUniqueDocumentCount(store, stats.count) : 0;

    return {
      exists: true,
      collectionName,
      count: stats.count,
      documentCount,
    };
  } catch {
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
