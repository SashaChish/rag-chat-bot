import { type NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withErrorHandler } from "@/lib/api/handler";
import { NotFoundError } from "@/lib/api/errors";
import { db } from "@/lib/db";
import { documentsTable } from "@/lib/db/schema";

async function getDownload(
  _request: NextRequest,
  context?: { params: Promise<Record<string, string>> },
): Promise<NextResponse> {
  const { id } = await context!.params;

  const [row] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, id));

  if (!row) {
    throw new NotFoundError(`Document "${id}" not found`);
  }

  const buffer = Buffer.from(row.content || "", "utf-8");
  const response = new NextResponse(new Uint8Array(buffer));

  response.headers.set("Content-Type", "text/plain");
  response.headers.set("Content-Disposition", `attachment; filename="${id}"`);
  response.headers.set("Content-Length", buffer.length.toString());

  return response;
}

export const GET = withErrorHandler(getDownload);
