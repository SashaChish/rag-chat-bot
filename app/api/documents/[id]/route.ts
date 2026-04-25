import { type NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import {
  deleteDocumentChunks,
  getDocumentStats,
} from "@/lib/mastra/vectorstore";
import { deleteDocument } from "@/lib/db/utils";

async function deleteDocumentRoute(
  _request: NextRequest,
  context?: { params: Promise<Record<string, string>> },
): Promise<NextResponse> {
  const { id } = await context!.params;

  await deleteDocument(id);
  await deleteDocumentChunks(id);

  return NextResponse.json({
    id,
    message: "Document deleted successfully",
  });
}

async function getDocument(
  _request: NextRequest,
  context?: { params: Promise<Record<string, string>> },
): Promise<NextResponse> {
  const { id } = await context!.params;
  const stats = await getDocumentStats(id);

  return NextResponse.json({ id, ...stats });
}

export const DELETE = withErrorHandler(deleteDocumentRoute);
export const GET = withErrorHandler(getDocument);
