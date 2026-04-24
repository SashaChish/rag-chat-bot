import { type NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import { NotFoundError } from "@/lib/api/errors";
import { getDocumentContent } from "@/lib/mastra/vectorstore";

async function getDownload(
  _request: NextRequest,
  context?: { params: Promise<Record<string, string>> },
): Promise<NextResponse> {
  const { id } = await context!.params;
  const content = await getDocumentContent(id);

  if (content === null) {
    throw new NotFoundError(`Document "${id}" not found`);
  }

  const buffer = Buffer.from(content, "utf-8");
  const response = new NextResponse(new Uint8Array(buffer));
  response.headers.set("Content-Type", "text/plain");
  response.headers.set(
    "Content-Disposition",
    `attachment; filename="${id}"`,
  );
  response.headers.set("Content-Length", buffer.length.toString());
  return response;
}

export const GET = withErrorHandler(getDownload);
