import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/upload";
import { loadDocument, validateFile, isFormatSupported, getSupportedFormatsList } from "@/lib/llamaindex/loaders";
import { addDocuments, getIndexStats } from "@/lib/llamaindex/index";
import { generateDocumentId, formatFileSize } from "@/lib/llamaindex/utils";
import { initializeSettings } from "@/lib/llamaindex/settings";
import type { ErrorResponse, DocumentUploadResponse, DocumentsGetResponse, DocumentListResponse } from "@/lib/types/api";

interface DocumentEntry {
  id: string;
  file_name: string;
  file_type: string;
  upload_date: string;
  file_url: string | null;
  stored_file_path: string | null;
  chunk_count: number;
  content: string;
  file_size: string | null;
}

initializeSettings();
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    try {
      validateFile(file);
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 400 }
      );
    }

    const savedFile = await saveUploadedFile(file);

    try {
      const documents = await loadDocument(savedFile.path);

      if (documents.length === 0) {
        throw new Error("No content could be extracted from file");
      }

      const documentsWithMetadata = documents.map(doc => ({
        ...doc,
        metadata: {
          ...(doc.metadata || {}),
          file_name: file.name,
          file_url: `/uploads/${savedFile.filename}`,
          stored_file_path: savedFile.path,
        }
      }));

      await addDocuments(documentsWithMetadata);

      const documentId = generateDocumentId(file.name);

      const response: DocumentUploadResponse = {
        success: true,
        id: documentId,
        filename: file.name,
        originalName: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        chunksProcessed: documents.length,
        message: "Document uploaded and indexed successfully",
      };

      return NextResponse.json(response);
    } catch (error) {
      deleteUploadedFile(savedFile.path);
      throw error;
    }
  } catch (error) {
    console.error("Error in document upload:", error);
    return NextResponse.json(
      {
        error: (error as Error).message || "Failed to upload document",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "list") {
      return await getDocumentList();
    }

    const stats = await getIndexStats();

    const formats = getSupportedFormatsList();

    const response: DocumentsGetResponse = {
      stats: {
        exists: stats.exists,
        collectionName: stats.collectionName,
        count: stats.count,
      },
      supportedFormats: formats.map(f => f.extensions.replace(/, /g, "").trim()),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting documents:", error);
    return NextResponse.json(
      { error: "Failed to retrieve document information" },
      { status: 500 }
    );
  }
}

async function getDocumentList(): Promise<NextResponse> {
  try {
    const { getChromaClient } = await import("@/lib/llamaindex/vectorstore");
    const { getFileInfo } = await import("@/lib/upload");
    const { formatFileSize } = await import("@/lib/llamaindex/utils");

    const client = await getChromaClient();
    const collection = await client.getCollection({ name: "documents" });

    const result = await collection.get({
      include: ["metadatas", "documents"],
    });

    if (!result || !result.metadatas || result.metadatas.length === 0) {
      const response: DocumentListResponse = {
        documents: [],
      };
      return NextResponse.json(response);
    }

    // Group by file_name to get unique documents
    const documentMap = new Map<string, DocumentEntry>();

    for (let i = 0; i < result.metadatas.length; i++) {
      const metadata = result.metadatas[i];
      const document = result.documents[i];
      const fileName = metadata?.file_name;

      if (!fileName) continue;

      // @ts-ignore
      if (!documentMap.has(fileName)) {
        // Initialize document entry
        // @ts-ignore - Type inference issue with ChromaDB result handling
        documentMap.set(fileName, {
          id: fileName,
          file_name: fileName,
          file_type: metadata?.file_type || "UNKNOWN",
          upload_date: metadata?.upload_date || new Date().toISOString(),
          file_url: metadata?.file_url || null,
          stored_file_path: metadata?.stored_file_path || null,
          chunk_count: 0,
          content: "",
          file_size: null,
        } as DocumentEntry);
      }

      // Increment chunk count
      // @ts-ignore
      // @ts-ignore
      const docEntry = documentMap.get(fileName);
      // @ts-ignore
      // @ts-ignore
      docEntry.chunk_count++;

      if (document) {
        docEntry.content += document;
      }
    }

    const documents = Array.from(documentMap.values());

    for (const doc of documents) {
      if (doc.stored_file_path) {
        const fileInfo = getFileInfo(doc.stored_file_path);
        if (fileInfo) {
          doc.file_size = formatFileSize(fileInfo.size);
        }
      }
    }

    documents.sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime());

    const response: DocumentListResponse = {
      documents,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting document list:", error);
    return NextResponse.json(
      { error: "Failed to retrieve document list" },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}