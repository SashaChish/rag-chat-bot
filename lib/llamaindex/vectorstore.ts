import { ChromaClient } from "chromadb";

let chromaClient: ChromaClient | null = null;
let initialized: boolean = false;

export async function initChroma(): Promise<ChromaClient> {
  if (initialized && chromaClient) {
    return chromaClient;
  }

  const chromaHost = process.env.CHROMA_HOST || "localhost";
  const chromaPort = parseInt(process.env.CHROMA_PORT || "8000", 10);

  try {
    chromaClient = new ChromaClient({
      host: chromaHost,
      port: chromaPort,
    });

    await chromaClient.listCollections();

    initialized = true;
    console.log(`Chroma initialized connecting to http://${chromaHost}:${chromaPort}`);
    return chromaClient;
  } catch (error) {
    console.error("Failed to initialize Chroma:", error);
    console.warn("\n" + "=".repeat(60));
    console.warn("ChromaDB server not found!");
    console.warn("Please run: docker run -p 8000:8000 chromadb/chroma");
    console.warn("Or install locally: https://docs.trychroma.com/deployment/local");
    console.warn("=".repeat(60));

    console.warn("Falling back to in-memory Chroma (data will not persist after restart)");
    chromaClient = new ChromaClient();

    initialized = true;
    return chromaClient;
  }
}

export async function getVectorStore(): Promise<ChromaClient> {
  if (!initialized) {
    await initChroma();
  }
  return chromaClient as ChromaClient;
}

/**
 * Get Chroma client instance
 */
export async function getChromaClient(): Promise<ChromaClient> {
  return await getVectorStore();
}

export async function getCollection(collectionName: string = "documents"): Promise<any> {
  const client = await getChromaClient();

  try {
    const collection = await client.getOrCreateCollection({
      name: collectionName,
      metadata: { description: "RAG Chatbot documents" },
    });

    return collection;
  } catch (error) {
    console.error("Error getting collection:", error);
    throw error;
  }
}

export async function hasDocuments(collectionName: string = "documents"): Promise<boolean> {
  try {
    const client = await getChromaClient();
    const coll = await client.getCollection({ name: collectionName });
    const count = await coll.count();

    return count > 0;
  } catch (error) {
    console.error("Error checking for documents:", error);
    return false;
  }
}

export async function clearCollection(collectionName: string = "documents"): Promise<{ success: boolean; error?: string }> {
  try {
    const client = await getChromaClient();

    try {
      await client.deleteCollection({ name: collectionName });
    } catch (e) {
    }

    await client.createCollection({
      name: collectionName,
      metadata: { description: "RAG Chatbot documents" },
    });

    return { success: true };
  } catch (error) {
    console.error("Error clearing collection:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

export async function deleteDocument(id: string, collectionName: string = "documents"): Promise<{ success: boolean; chunksDeleted?: number; error?: string }> {
  try {
    const coll = await getCollection(collectionName);

    const results = await coll.get({
      where: { file_name: id },
    });

    if (!results.ids || results.ids.length === 0) {
      return { success: true, chunksDeleted: 0 };
    }

    // Delete all chunks with their actual IDs
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

export async function getCollectionStats(collectionName: string = "documents"): Promise<{ exists: boolean; collectionName: string; count: number }> {
  try {
    const client = await getChromaClient();
    const coll = await client.getCollection({ name: collectionName });
    const count = await coll.count();

    return {
      exists: true,
      collectionName,
      count,
    };
  } catch (error) {
    return {
      exists: false,
      collectionName,
      count: 0,
    };
  }
}

export async function getAllDocuments(): Promise<{ documents: any[]; total_chunks: number }> {
  try {
    const coll = await getCollection();

    const results = await coll.get();

    if (!results || !results.metadatas || results.metadatas.length === 0) {
      return { documents: [], total_chunks: 0 };
    }

    // Group by file_name to get unique documents
    const documents: Record<string, any> = {};
    results.metadatas.forEach((metadata: any) => {
      const fileName = metadata.file_name || "unknown";

      if (!documents[fileName]) {
        documents[fileName] = {
          file_name: fileName,
          file_type: metadata.file_type || "unknown",
          chunk_count: 0,
          upload_date: metadata.upload_date || null,
          stored_file_path: metadata.stored_file_path || null,
          first_chunk_id: results.ids[results.metadatas.indexOf(metadata)],
        };
      }

      documents[fileName].chunk_count++;
    });

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
    throw new Error(`Failed to retrieve documents: ${(error as Error).message}`);
  }
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

    // Delete all chunks with their actual IDs
    await coll.delete({ ids: results.ids });

    return results.ids.length;
  } catch (error) {
    console.error(`Error deleting document ${fileName}:`, error);
    throw new Error(`Failed to delete document: ${(error as Error).message}`);
  }
}