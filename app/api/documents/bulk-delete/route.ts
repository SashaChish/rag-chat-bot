import { type NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import { validateBody } from "@/lib/api/validate";
import { bulkDeleteRequestSchema } from "@/lib/api/schemas";
import { deleteDocumentByName } from "@/lib/mastra/vectorstore";

async function bulkDelete(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const { fileNames } = validateBody(bulkDeleteRequestSchema, body);

  let totalDeletedChunks = 0;
  const results = [];

  for (const fileName of fileNames) {
    try {
      const deletedCount = await deleteDocumentByName(fileName);
      totalDeletedChunks += deletedCount;
      results.push({
        file_name: fileName,
        deleted_chunks: deletedCount,
        success: true,
      });
    } catch (error) {
      results.push({
        file_name: fileName,
        deleted_chunks: 0,
        success: false,
        error: (error as Error).message,
      });
    }
  }

  return NextResponse.json({
    success: true,
    total_deleted_chunks: totalDeletedChunks,
    results,
  });
}

export const POST = withErrorHandler(bulkDelete);
