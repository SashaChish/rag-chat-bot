/**
 * Documents Cleanup API Route
 * Handles administrative cleanup of ChromaDB documents
 */

import { NextResponse } from "next/server";
import { initializeLlamaIndex } from "@/lib/llamaindex/utils.js";
import { getAllDocuments, deleteDocumentByName } from "@/lib/llamaindex/vectorstore.js";
import { clearIndex } from "@/lib/llamaindex/index.js";

// Initialize LlamaIndex on module load
initializeLlamaIndex();

/**
 * POST /api/documents/action/clean
 * Handle document cleanup operations
 *
 * Actions:
 * - "list": List all documents in ChromaDB
 * - "delete": Delete specific document(s)
 * - "clear": Clear all documents
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "list":
        // List all documents in ChromaDB
        const result = await getAllDocuments();
        return NextResponse.json({
          success: true,
          documents: result.documents,
          total_chunks: result.total_chunks,
        });

      case "delete":
        // Delete specific document(s)
        const { fileNames } = body;

        if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
          return NextResponse.json(
            { error: "fileNames array is required for delete action" },
            { status: 400 }
          );
        }

        let totalDeleted = 0;
        const results = [];

        for (const fileName of fileNames) {
          try {
            const deletedCount = await deleteDocumentByName(fileName);
            totalDeleted += deletedCount;
            results.push({
              file_name: fileName,
              deleted_chunks: deletedCount,
              success: true,
            });
          } catch (error) {
            results.push({
              file_name: fileName,
              error: error.message,
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
        const result = await clearIndex("documents");
        return NextResponse.json({
          success: result.success,
          message: result.success
            ? "All documents cleared from ChromaDB and collection recreated"
            : "Failed to clear documents",
          error: result.error || null,
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
