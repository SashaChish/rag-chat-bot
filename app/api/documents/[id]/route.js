/**
 * Document API Route
 * Handles document deletion and download by ID
 */

import { NextRequest, NextResponse } from "next/server";
import { deleteDocument } from "@/lib/llamaindex/index.js";
import { getCollection } from "@/lib/llamaindex/vectorstore.js";
import fs from "fs";
import path from "path";

/**
 * DELETE /api/documents/[id]
 * Delete a document by ID (all chunks) and the associated file
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Get document metadata to find the file path
    const coll = await getCollection();
    const results = await coll.get({
      where: { file_name: id },
    });

    // Delete document from index
    const deleteResult = await deleteDocument(id);

    // Delete the physical file if it exists
    if (results.metadatas && results.metadatas.length > 0) {
      const filePath = results.metadatas[0].stored_file_path;
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
      }
    }

    if (deleteResult.success) {
      return NextResponse.json({
        success: true,
        message: "Document deleted successfully",
      });
    } else {
      return NextResponse.json(
        { error: deleteResult.error || "Failed to delete document" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to delete document",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents/[id]
 * Get document info or download by ID
 * Use ?action=download query param to download the file
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Handle download action
    if (action === 'download') {
      // Find the file path from metadata
      const coll = await getCollection();
      const results = await coll.get({
        where: { file_name: id },
      });

      if (!results.metadatas || results.metadatas.length === 0) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }

      const filePath = results.metadatas[0].stored_file_path;
      const fileName = results.metadatas[0].file_name || id;
      const fileType = results.metadatas[0].file_type || 'application/octet-stream';

      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { error: "File not found on disk" },
          { status: 404 }
        );
      }

      // Read the file and send it
      const fileBuffer = fs.readFileSync(filePath);
      const response = new NextResponse(fileBuffer);

      // Set appropriate headers for download
      response.headers.set('Content-Type', fileType);
      response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
      response.headers.set('Content-Length', fileBuffer.length.toString());

      return response;
    }

    // Default GET returns document info
    const coll = await getCollection();
    const results = await coll.get({
      where: { file_name: id },
    });

    if (!results.metadatas || results.metadatas.length === 0) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id,
      file_name: results.metadatas[0].file_name,
      file_type: results.metadatas[0].file_type,
      upload_date: results.metadatas[0].upload_date,
      file_url: results.metadatas[0].file_url,
      chunk_count: results.ids?.length || 0,
    });
  } catch (error) {
    console.error("Error getting document:", error);
    return NextResponse.json(
      { error: "Failed to retrieve document information" },
      { status: 500 }
    );
  }
}
