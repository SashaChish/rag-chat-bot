import { ChromaVectorStore } from "@llamaindex/chroma";
import { storageContextFromDefaults } from "llamaindex";
import { tmpdir } from "os";
import path from "path";
import type { ChromaDocumentSummary } from "../types/core.types";

const STORAGE_DIR = process.env.STORAGE_DIR || path.join(tmpdir(), "llamaindex");

/**
 * Get StorageContext with proper three-tier architecture:
 * - docStore: SimpleDocumentStore (full documents with binary data)
 * - indexStore: KVIndexStore (document-to-chunk mappings)
 * - vectorStores: ChromaVectorStore (chunks for search)
 */
export async function getStorageContext() {
  const vectorStore = await getChromaVectorStore();
  return await storageContextFromDefaults({
    persistDir: STORAGE_DIR,
    vectorStores: {
      TEXT: vectorStore,
    },
  });
}

/**
 * Get ChromaVectorStore for LlamaIndex.TS integration
 * ChromaVectorStore creates and manages its own ChromaClient internally
 */
export async function getChromaVectorStore(): Promise<ChromaVectorStore> {
  return new ChromaVectorStore({
    collectionName: "documents",
  });
}

export async function getCollection() {
  const vectorStore = await getChromaVectorStore();
  return await vectorStore.getCollection();
}

export async function hasDocuments(): Promise<boolean> {
  try {
    const vectorStore = await getChromaVectorStore();
    const coll = await vectorStore.getCollection();
    const count = await coll.count();

    return count > 0;
  } catch (error) {
    console.error("Error checking for documents:", error);
    return false;
  }
}

export async function clearCollection(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const vectorStore = await getChromaVectorStore();
    const coll = await vectorStore.getCollection();

    const ids = await coll.get({});

    if (ids.ids && ids.ids.length > 0) {
      await coll.delete({ ids: ids.ids });
    }

    return { success: true };
  } catch (error) {
    console.error("Error clearing collection:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

export async function deleteDocument(
  id: string,
): Promise<{ success: boolean; chunksDeleted?: number; error?: string }> {
  try {
    const coll = await getCollection();

    const results = await coll.get({
      where: { file_name: id },
    });

    if (!results.ids || results.ids.length === 0) {
      return { success: true, chunksDeleted: 0 };
    }

    await coll.delete({
      ids: results.ids,
    });

    return { success: true, chunksDeleted: results.ids.length };
  } catch (error) {
    console.error("Error deleting document:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

export async function getCollectionStats(
  collectionName: string = "documents",
): Promise<{
  exists: boolean;
  collectionName: string;
  count: number;
  documentCount: number;
}> {
  try {
    const vectorStore = await getChromaVectorStore();
    const coll = await vectorStore.getCollection();
    const count = await coll.count();

    return {
      exists: true,
      collectionName,
      count,
      documentCount: 0,
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

export async function getAllDocuments(): Promise<{
  documents: ChromaDocumentSummary[];
  total_chunks: number;
}> {
  try {
    const coll = await getCollection();

    const results = await coll.get();

    if (!results || !results.metadatas || results.metadatas.length === 0) {
      return { documents: [], total_chunks: 0 };
    }

    const documents: Record<string, ChromaDocumentSummary> = {};

    for (let i = 0; i < results.metadatas.length; i++) {
      const metadata = results.metadatas[i];
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
          first_chunk_id: results.ids[i],
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
      total_chunks: results.metadatas.length,
    };
  } catch (error) {
    console.error("Error getting all documents:", error);
    return { documents: [], total_chunks: 0 };
  }
}

export async function getDocumentContent(fileName: string): Promise<string> {
  const coll = await getCollection();

  const results = await coll.get({
    where: { file_name: fileName },
  });

  if (!results.documents || results.documents.length === 0) {
    return "";
  }

  return results.documents.filter(Boolean).join("\n\n");
}

export async function deleteDocumentByName(fileName: string): Promise<number> {
  try {
    const coll = await getCollection();

    const results = await coll.get({
      where: { file_name: fileName },
    });

    if (!results || !results.ids || results.ids.length === 0) {
      return 0;
    }

    await coll.delete({ ids: results.ids });

    return results.ids.length;
  } catch (error) {
    console.error(`Error deleting document ${fileName}:`, error);
    throw new Error(`Failed to delete document: ${(error as Error).message}`);
  }
}
