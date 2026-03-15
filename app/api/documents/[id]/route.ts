import { NextRequest, NextResponse } from 'next/server';
import { deleteDocument } from '@/lib/llamaindex/index';
import { getChromaClient } from '@/lib/llamaindex/vectorstore';
import fs from 'fs';
import path from 'path';
import type { ErrorResponse } from '@/lib/types/api';
import type { ChromaCollection } from '@/lib/types/chromadb-compatibility';

async function getChromaCollection(): Promise<ChromaCollection> {
  const client = await getChromaClient();
  return await client.getCollection({ name: "documents" }) as unknown as ChromaCollection;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const coll = await getChromaCollection();
    const results = await coll.get();

    const deleteResult = await deleteDocument(id);

    const { metadatas } = results || {};
    if (metadatas && metadatas.length > 0) {
      const { stored_file_path: filePath } = metadatas[0] || {};
      if (filePath && fs.existsSync(filePath as string)) {
        fs.unlinkSync(filePath as string);
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
        error: (error as Error).message || "Failed to delete document",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
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

    if (action === 'download') {
      const coll = await getChromaCollection();
      const results = await coll.get();

      const { metadatas } = results || {};
      if (!metadatas || metadatas.length === 0) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }

      const { stored_file_path: filePath, file_name, file_type } = metadatas[0] || {};
      const fileName = file_name || id;
      const fileType = file_type || 'application/octet-stream';

      if (!fs.existsSync(filePath as string)) {
        return NextResponse.json(
          { error: "File not found on disk" },
          { status: 404 }
        );
      }

      const fileBuffer = fs.readFileSync(filePath as string);
      const response = new NextResponse(fileBuffer);

      response.headers.set('Content-Type', fileType as string);
      response.headers.set('Content-Disposition', `attachment; filename="${fileName as string}"`);
      response.headers.set('Content-Length', fileBuffer.length.toString());

      return response;
    }

    const coll = await getChromaCollection();
    const results = await coll.get();

    const { metadatas } = results || {};
    if (!metadatas || metadatas.length === 0) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const { ids } = results || {};
    const { file_name, file_type, upload_date, file_url } = metadatas[0] || {};
    return NextResponse.json({
      id,
      file_name,
      file_type,
      upload_date,
      file_url,
      chunk_count: ids?.length || 0,
    });
  } catch (error) {
    console.error("Error getting document:", error);
    return NextResponse.json(
      { error: "Failed to retrieve document information" },
      { status: 500 }
    );
  }
}