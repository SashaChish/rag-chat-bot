import { type NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withErrorHandler } from "@/lib/api/handler";
import { validateBody } from "@/lib/api/validate";
import { bulkDeleteRequestSchema } from "@/lib/api/schemas";
import { deleteDocumentChunks } from "@/lib/mastra/vectorstore";
import { db } from "@/lib/db";
import { documentsTable } from "@/lib/db/schema";

async function bulkDelete(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const { fileNames } = validateBody(bulkDeleteRequestSchema, body);

  const results = [];

  for (const fileName of fileNames) {
    try {
      const [row] = await db
        .select({ id: documentsTable.id })
        .from(documentsTable)
        .where(eq(documentsTable.filename, fileName));

      if (!row) {
        results.push({
          file_name: fileName,
          deleted_id: null,
          success: false,
          error: "Document not found",
        });
        continue;
      }

      await db.delete(documentsTable).where(eq(documentsTable.id, row.id));
      await deleteDocumentChunks(row.id);

      results.push({
        file_name: fileName,
        deleted_id: row.id,
        success: true,
      });
    } catch (error) {
      results.push({
        file_name: fileName,
        deleted_id: null,
        success: false,
        error: (error as Error).message,
      });
    }
  }

  return NextResponse.json({
    success: true,
    results,
  });
}

export const POST = withErrorHandler(bulkDelete);
