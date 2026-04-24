import { type NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import { getAllDocuments } from "@/lib/mastra/vectorstore";
import type { DocumentListEntry } from "@/lib/types/core.types";
import type { DocumentListResponse } from "@/lib/types/api";

async function getList(_request: NextRequest): Promise<NextResponse> {
  const { documents } = await getAllDocuments();

  const documentEntries: DocumentListEntry[] = documents.map((doc) => ({
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
}

export const GET = withErrorHandler(getList);
