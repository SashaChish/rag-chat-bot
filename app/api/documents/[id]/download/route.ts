import { type NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import { NotFoundError } from "@/lib/api/errors";
import { getDocument } from "@/lib/db/utils";

async function download(
  _request: NextRequest,
  context?: { params: Promise<Record<string, string>> },
): Promise<NextResponse> {
  const { id } = await context!.params;

  const [row] = await getDocument(id);

  if (!row) {
    throw new NotFoundError(`Document "${id}" not found`);
  }

  const buffer = Buffer.from(row.content || "", "utf-8");

  const response = new NextResponse<Uint8Array<ArrayBuffer>>(
    new Uint8Array(buffer),
  );

  response.headers.set("Content-Type", "text/plain");
  response.headers.set("Content-Disposition", `attachment; filename="${id}"`);
  response.headers.set("Content-Length", buffer.length.toString());

  return response;
}

export const GET = withErrorHandler(download);
