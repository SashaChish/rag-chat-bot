import { type NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import { loadDocumentFromBuffer, validateFile } from "@/lib/mastra/loaders";
import { addDocuments, clearIndexCache } from "@/lib/mastra/index";
import { getCollectionStats } from "@/lib/mastra/vectorstore";
import { formatFileSize } from "@/lib/utils/format.utils";
import type {
  DocumentUploadResponse,
  DocumentsGetResponse,
} from "@/lib/types/api";

async function uploadDocument(request: NextRequest): Promise<NextResponse> {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR" as const, message: "No file provided" } },
      { status: 400 },
    );
  }

  validateFile(file);

  const buffer = Buffer.from(await file.arrayBuffer());
  const { documents } = await loadDocumentFromBuffer(buffer, file.name);

  if (documents.length === 0) {
    throw new Error("No content could be extracted from file");
  }

  clearIndexCache();
  const result = await addDocuments(documents);

  const response: DocumentUploadResponse = {
    success: true,
    id: file.name,
    filename: file.name,
    originalName: file.name,
    size: formatFileSize(file.size),
    type: file.type,
    chunksProcessed: result.chunksProcessed,
    message: "Document uploaded and indexed successfully",
  };

  return NextResponse.json(response);
}

async function getStats(_request: NextRequest): Promise<NextResponse> {
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
}

export const POST = withErrorHandler(uploadDocument);
export const GET = withErrorHandler(getStats);
