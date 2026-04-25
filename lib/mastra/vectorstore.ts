import { ChromaVector } from "@mastra/chroma";
import { MDocument } from "@mastra/rag";
import { count } from "drizzle-orm";
import { embedMany } from "ai";
import { db } from "../db";
import { documentsTable } from "../db/schema";
import type { IndexStats, DocumentChunk } from "../types/core.types";
import { getEmbeddingModel, CHUNK_SIZE, CHUNK_OVERLAP } from "./config";

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

// TODO: refactor
export async function addDocumentsToVectorStore(documents: DocumentChunk[]) {
  if (documents.length === 0) {
    return { chunksProcessed: 0 };
  }
  console.log(documents);
  const allChunks = [];

  for (const doc of documents) {
    const mDoc =
      doc.fileType === "md"
        ? MDocument.fromMarkdown(doc.content, { file_name: doc.filename })
        : MDocument.fromText(doc.content, { file_name: doc.filename });

    const chunks = await mDoc.chunk({
      strategy: "recursive",
      maxSize: CHUNK_SIZE,
      overlap: CHUNK_OVERLAP,
    });

    for (let i = 0; i < chunks.length; i++) {
      allChunks.push({
        text: chunks[i].text,
        metadata: {
          document_id: doc.id,
          file_name: doc.filename,
          file_type: doc.fileType,
          upload_date: doc.uploadDate,
          chunk_index: i,
          chunk_text: chunks[i].text,
        },
      });
    }
  }

  const embeddingModel = getEmbeddingModel();

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: allChunks.map((c) => c.text),
  });

  await ensureIndex(embeddings[0].length);

  const store = getVectorStore();

  await store.upsert({
    indexName: INDEX_NAME,
    vectors: embeddings,
    metadata: allChunks.map((c) => c.metadata),
    documents: allChunks.map((c) => c.text),
  });

  return {
    chunksProcessed: allChunks.length,
  };
}

export function getVectorStore(): ChromaVector {
  if (!vectorStoreInstance) {
    const config = buildChromaConfig();
    vectorStoreInstance = new ChromaVector(config);
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

export async function deleteDocumentChunks(fileId: string) {
  try {
    const store = getVectorStore();
    await store.deleteVectors({
      indexName: INDEX_NAME,
      filter: { document_id: fileId },
    });
  } catch (error) {
    throw new Error(
      `Failed to delete document from Vector Store: ${(error as Error).message}`,
    );
  }
}

// TODO: Need refactor, separete chroma db and postgree db operations
export async function getCollectionStats(
  collectionName: string = INDEX_NAME,
): Promise<IndexStats> {
  try {
    const [row] = await db.select({ count: count() }).from(documentsTable);
    const documentCount = row?.count ?? 0;

    let vectorCount = 0;
    try {
      const store = getVectorStore();
      const indexes = await store.listIndexes();
      if (indexes.includes(INDEX_NAME)) {
        const stats = await store.describeIndex({ indexName: INDEX_NAME });
        vectorCount = stats.count;
      }
    } catch {
      // ChromaDB index may not exist yet
    }

    return {
      exists: documentCount > 0 || vectorCount > 0,
      collectionName,
      count: vectorCount,
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
  await db.delete(documentsTable);

  const store = getVectorStore();
  const indexes = await store.listIndexes();
  if (indexes.includes(INDEX_NAME)) {
    await store.deleteIndex({ indexName: INDEX_NAME });
  }
}
