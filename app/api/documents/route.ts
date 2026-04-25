import { type NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import { loadDocumentFromBuffer, validateFile } from "@/lib/mastra/loaders";
import {
  addDocumentsToVectorStore,
  getCollectionStats,
} from "@/lib/mastra/vectorstore";
import { formatFileSize } from "@/lib/utils/format.utils";
import type {
  DocumentUploadResponse,
  GetDocumentsResponse,
} from "@/lib/types/api";
import { db } from "@/lib/db";
import { documentsTable } from "@/lib/db/schema";
import { getAllDocuments } from "@/lib/db/utils";

async function uploadDocument(request: NextRequest): Promise<NextResponse> {
  const formData = await request.formData();
  const { file } = validateFile(formData.get("file"));
  const buffer = Buffer.from(await file.arrayBuffer());
  const document = await loadDocumentFromBuffer(buffer, file.name);
  const { chunksProcessed } = await addDocumentsToVectorStore([document]);

  const [addedDocument] = await db
    .insert(documentsTable)
    .values({
      ...document,
      fileType: document.fileType || file.type,
      fileSize: file.size,
      chunkCount: chunksProcessed,
    })
    .returning();

  const response: DocumentUploadResponse = {
    document: {
      ...addedDocument,
      fileSize: formatFileSize(addedDocument.fileSize),
    },
    message: "Document uploaded and indexed successfully",
  };

  return NextResponse.json(response);
}

async function getDocuments(_request: NextRequest): Promise<NextResponse> {
  const stats = await getCollectionStats();
  const documents = await getAllDocuments();
  const response: GetDocumentsResponse = { documents, stats };

  return NextResponse.json(response);
}

export const POST = withErrorHandler(uploadDocument);
export const GET = withErrorHandler(getDocuments);
