import { type NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import {
  deleteDocumentByName,
  getDocumentStats,
} from "@/lib/mastra/vectorstore";

async function deleteDocument(
  _request: NextRequest,
  context?: { params: Promise<Record<string, string>> },
): Promise<NextResponse> {
  const { id } = await context!.params;

  await deleteDocumentByName(id);

  return NextResponse.json({
    success: true,
    message: "Document deleted successfully",
  });
}

async function getDocument(
  _request: NextRequest,
  context?: { params: Promise<Record<string, string>> },
): Promise<NextResponse> {
  const { id } = await context!.params;
  const stats = await getDocumentStats(id);

  return NextResponse.json({
    id,
    ...stats,
  });
}

export const DELETE = withErrorHandler(deleteDocument);
export const GET = withErrorHandler(getDocument);
