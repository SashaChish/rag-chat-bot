import { type NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import { NotFoundError } from "@/lib/api/errors";
import { getDocumentContent } from "@/lib/mastra/vectorstore";

async function getPreview(
  _request: NextRequest,
  context?: { params: Promise<Record<string, string>> },
): Promise<NextResponse> {
  const { id } = await context!.params;
  const content = await getDocumentContent(id);

  if (content === null) {
    throw new NotFoundError(`Document "${id}" not found`);
  }

  return NextResponse.json({ content });
}

export const GET = withErrorHandler(getPreview);
