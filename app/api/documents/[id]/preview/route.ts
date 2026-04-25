import { type NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withErrorHandler } from "@/lib/api/handler";
import { NotFoundError } from "@/lib/api/errors";
import { db } from "@/lib/db";
import { documentsTable } from "@/lib/db/schema";

async function getPreview(
  _request: NextRequest,
  context?: { params: Promise<Record<string, string>> },
): Promise<NextResponse> {
  const { id } = await context!.params;

  const [row] = await db
    .select({ content: documentsTable.content })
    .from(documentsTable)
    .where(eq(documentsTable.id, id));

  if (!row) {
    throw new NotFoundError("Document not found");
  }

  return NextResponse.json({ content: row.content });
}

export const GET = withErrorHandler(getPreview);
