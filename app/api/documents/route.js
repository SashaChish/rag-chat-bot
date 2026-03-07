/**
 * Documents API Route
 * Handles file uploads and document management
 */

import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/upload.js";
import { loadDocument, validateFile, isFormatSupported, getSupportedFormatsList } from "@/lib/llamaindex/loaders.js";
import { addDocuments, getIndexStats } from "@/lib/llamaindex/index.js";
import { generateDocumentId, formatFileSize } from "@/lib/llamaindex/utils.js";
import { initializeSettings } from "@/lib/llamaindex/settings.js";

// Initialize LlamaIndex.TS settings on module load
initializeSettings();

/**
 * POST /api/documents
 * Upload and index a document
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file
    try {
      validateFile(file);
    } catch (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Save file temporarily
    const savedFile = await saveUploadedFile(file);

    try {
      // Load document using LlamaIndex.TS
      const documents = await loadDocument(savedFile.path);

      if (documents.length === 0) {
        throw new Error("No content could be extracted from the file");
      }

      // Store the public URL path in document metadata for download
      const documentsWithMetadata = documents.map(doc => ({
        ...doc,
        metadata: {
          ...(doc.metadata || {}),
          file_url: `/uploads/${savedFile.filename}`,
          stored_file_path: savedFile.path,
        }
      }));

      // Add to index
      await addDocuments(documentsWithMetadata);

      // Generate document ID
      const documentId = generateDocumentId(file.name);

      return NextResponse.json({
        success: true,
        id: documentId,
        filename: file.name,
        originalName: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        chunksProcessed: documents.length,
        message: "Document uploaded and indexed successfully",
      });
    } catch (error) {
      // Clean up temporary file on error (before it was indexed)
      deleteUploadedFile(savedFile.path);
      throw error;
    }
    // Note: After successful upload, we keep the file in public/uploads for download
  } catch (error) {
    console.error("Error in document upload:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to upload document",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents
 * List uploaded documents and get index stats
 */
export async function GET(request) {
  try {
    // Get index stats
    const stats = await getIndexStats();

    // Get supported formats
    const formats = getSupportedFormatsList();

    return NextResponse.json({
      stats: {
        exists: stats.exists,
        collectionName: stats.collectionName,
      },
      supportedFormats: formats,
    });
  } catch (error) {
    console.error("Error getting documents:", error);
    return NextResponse.json(
      { error: "Failed to retrieve document information" },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/documents
 * Handle CORS preflight
 */
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
