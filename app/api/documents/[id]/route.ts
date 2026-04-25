import { type NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import { deleteDocumentChunks } from "@/lib/mastra/vectorstore";
import { deleteDocument, getDocument } from "@/lib/db/utils";
import type { DocumentEntry } from "@/lib/db/types";

async function deleteDocumentRoute(
  _request: NextRequest,
  context?: { params: Promise<Record<string, string>> },
): Promise<NextResponse> {
  const { id } = await context!.params;

  await deleteDocument(id);
  await deleteDocumentChunks(id);

  return NextResponse.json({ id, message: "Document deleted successfully" });
}

async function getDocumentRoute(
  _request: NextRequest,
  context?: { params: Promise<Record<string, string>> },
): Promise<NextResponse<DocumentEntry>> {
  const { id } = await context!.params;
  const [document] = await getDocument(id);

  return NextResponse.json(document);
}

export const DELETE = withErrorHandler(deleteDocumentRoute);
export const GET = withErrorHandler(getDocumentRoute);
