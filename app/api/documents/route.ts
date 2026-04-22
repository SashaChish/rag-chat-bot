import { type NextRequest, NextResponse } from "next/server";
import { Document } from "@llamaindex/core/schema";
import { VectorStoreIndex } from "llamaindex";
import { loadDocumentFromBuffer, validateFile } from "@/lib/llamaindex/loaders";
import {
  getChromaVectorStore,
  getStorageContext,
  getCollectionStats,
  getAllDocuments,
  getDocumentContent,
} from "@/lib/llamaindex/vectorstore";
import { formatFileSize } from "@/lib/utils/format.utils";
import { initializeSettings } from "@/lib/llamaindex/settings";
import type {
  DocumentUploadResponse,
  DocumentsGetResponse,
  DocumentListResponse,
} from "@/lib/types/api";

initializeSettings();
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    try {
      validateFile(file);
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { documents } = await loadDocumentFromBuffer(buffer, file.name);

    if (documents.length === 0) {
      throw new Error("No content could be extracted from file");
    }

    const uploadDate = new Date().toISOString();

    const storageContext = await getStorageContext();

    const fullText = documents
      .map((d) => d.text)
      .filter(Boolean)
      .join("\n\n");

    const documentDocId = `doc_${Date.now()}`;
    const fullDocument = new Document({
      text: fullText,
      id_: documentDocId,
      metadata: {
        file_name: file.name,
        file_type: file.type,
        upload_date: uploadDate,
        original_file_buffer: buffer.toString("base64"),
      },
    });

    await storageContext.docStore.addDocuments([fullDocument], false);

    const lightweightDocument = new Document({
      text: fullText,
      metadata: {
        file_name: file.name,
        file_type: file.type,
        upload_date: uploadDate,
      },
    });

    const vectorStore = await getChromaVectorStore();

    await VectorStoreIndex.fromDocuments([lightweightDocument], {
      storageContext,
      vectorStores: {
        TEXT: vectorStore,
      },
    });

    const documentId = crypto.randomUUID();

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
    console.error("Error in document upload:", error);
    return NextResponse.json(
      {
        error: (error as Error).message || "Failed to upload document",
      },
      { status: 500 },
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

    if (action === "preview") {
      const fileName = searchParams.get("file_name");

      if (!fileName) {
        return NextResponse.json(
          { error: "file_name parameter is required" },
          { status: 400 },
        );
      }

      const content = await getDocumentContent(fileName);

      return NextResponse.json({ content });
    }

    const stats = await getCollectionStats();

    const response: DocumentsGetResponse = {
      stats: {
        exists: stats.exists,
        collectionName: stats.collectionName,
        count: stats.count,
        documentCount: stats.documentCount,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting documents:", error);
    return NextResponse.json(
      { error: "Failed to retrieve document information" },
      { status: 500 },
    );
  }
}

async function getDocumentList(): Promise<NextResponse> {
  try {
    const { documents, total_chunks: _total_chunks } = await getAllDocuments();

    const documentEntries = documents.map((doc) => ({
      id: doc.file_name,
      file_name: doc.file_name,
      file_type: doc.file_type,
      upload_date: doc.upload_date || new Date().toISOString(),
      chunk_count: doc.chunk_count,
      content: "",
      file_size: null,
      can_download: true,
    }));

    const response: DocumentListResponse = {
      documents: documentEntries,
    };

    return NextResponse.json(response);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to retrieve document list" },
      { status: 500 },
    );
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
