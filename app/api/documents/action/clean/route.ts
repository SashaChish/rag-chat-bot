import { NextRequest, NextResponse } from 'next/server';
import { initializeLlamaIndex } from '@/lib/core/llamaindex/core.utils';
import { getAllDocuments, deleteDocumentByName } from '@/lib/llamaindex/vectorstore';
import { clearIndex } from '@/lib/llamaindex/index';
import type { DocumentListEntry } from '@/lib/types/core.types';

initializeLlamaIndex();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { action?: string; fileNames?: string[] };
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "list":
        const listResult = await getAllDocuments();
        return NextResponse.json({
          success: true,
          documents: listResult.documents,
          total_chunks: listResult.total_chunks,
        });

      case "delete":
        const { fileNames } = body;

        if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
          return NextResponse.json(
            { error: "fileNames array is required for delete action" },
            { status: 400 }
          );
        }

        let totalDeleted = 0;
        const results: DocumentListEntry[] = [];

        for (const fileName of fileNames) {
          try {
            const deletedCount = await deleteDocumentByName(fileName);
            totalDeleted += deletedCount;
            results.push({
              id: fileName,
              file_name: fileName,
              file_type: "unknown",
              upload_date: new Date().toISOString(),
              file_url: null,
              stored_file_path: null,
              chunk_count: deletedCount,
              content: "",
              file_size: null,
              deleted_chunks: deletedCount,
              success: true,
            });
          } catch (error) {
            results.push({
              id: fileName,
              file_name: fileName,
              file_type: "unknown",
              upload_date: new Date().toISOString(),
              file_url: null,
              stored_file_path: null,
              chunk_count: 0,
              content: "",
              file_size: null,
              deleted_chunks: 0,
              error: (error as Error).message,
              success: false,
            });
          }
        }

        // Clear index cache to force rebuild
        await clearIndex("documents");

        return NextResponse.json({
          success: true,
          total_deleted_chunks: totalDeleted,
          results,
        });

      case "clear":
        // Clear all documents
        const clearResult = await clearIndex("documents");
        return NextResponse.json({
          success: clearResult.success,
          message: clearResult.success
            ? "All documents cleared from ChromaDB and collection recreated"
            : "Failed to clear documents",
          error: clearResult.error || null,
        });

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions are: list, delete, clear` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in cleanup API:", error);
    return NextResponse.json(
      { error: "Failed to process cleanup request" },
      { status: 500 }
    );
  }
}