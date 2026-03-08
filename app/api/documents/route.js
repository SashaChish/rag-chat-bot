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
          file_name: file.name, // Use original filename instead of stored filename
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
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Handle document list action
    if (action === "list") {
      return await getDocumentList();
    }

    // Get index stats
    const stats = await getIndexStats();

    // Get supported formats
    const formats = getSupportedFormatsList();

    return NextResponse.json({
      stats: {
        exists: stats.exists,
        collectionName: stats.collectionName,
        count: stats.count,
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
 * Get list of all indexed documents with metadata
 */
async function getDocumentList() {
  try {
    const { getChromaClient } = await import("@/lib/llamaindex/vectorstore.js");
    const { getFileInfo } = await import("@/lib/upload.js");
    const { formatFileSize } = await import("@/lib/llamaindex/utils.js");

    // Get Chroma collection directly
    const client = await getChromaClient();
    const collection = await client.getCollection({ name: "documents" });

    // Get all documents from the collection
    const result = await collection.get({
      include: ["metadatas", "documents"],
    });

    if (!result || !result.metadatas || result.metadatas.length === 0) {
      return NextResponse.json({
        documents: [],
      });
    }

    // Group by file_name to get unique documents
    const documentMap = new Map();

    for (let i = 0; i < result.metadatas.length; i++) {
      const metadata = result.metadatas[i];
      const document = result.documents[i];
      const fileName = metadata.file_name;

      if (!fileName) continue;

      if (!documentMap.has(fileName)) {
        // Initialize document entry
        documentMap.set(fileName, {
          id: fileName,
          file_name: fileName,
          file_type: metadata.file_type || "UNKNOWN",
          upload_date: metadata.upload_date || new Date().toISOString(),
          file_url: metadata.file_url || null,
          stored_file_path: metadata.stored_file_path || null,
          chunk_count: 0,
          content: document || "",
          file_size: null,
        });
      }

      // Increment chunk count
      const docEntry = documentMap.get(fileName);
      docEntry.chunk_count++;

      // Store content if not already stored
      if (!docEntry.content && document) {
        docEntry.content = document;
      }
    }

    // Get file size for each document
    const documents = Array.from(documentMap.values());

    for (const doc of documents) {
      if (doc.stored_file_path) {
        const fileInfo = getFileInfo(doc.stored_file_path);
        if (fileInfo) {
          doc.file_size = formatFileSize(fileInfo.size);
        }
      }
    }

    // Sort by upload date (newest first)
    documents.sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date));

    return NextResponse.json({
      documents,
    });
  } catch (error) {
    console.error("Error getting document list:", error);
    return NextResponse.json(
      { error: "Failed to retrieve document list" },
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
