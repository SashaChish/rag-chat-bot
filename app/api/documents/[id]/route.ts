import { type NextRequest, NextResponse } from "next/server";
import { deleteDocument } from "@/lib/llamaindex/index";
import { getCollection, getStorageContext } from "@/lib/llamaindex/vectorstore";
import { initializeSettings } from "@/lib/llamaindex/settings";

initializeSettings();

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 },
      );
    }

    const deleteResult = await deleteDocument(id);

    if (!deleteResult.success) {
      return NextResponse.json(
        { error: deleteResult.error || "Failed to delete document" },
        { status: 500 },
      );
    }

    const { docStore } = await getStorageContext();
    const docInfos = docStore.getAllRefDocInfo();

    for (const [docId] of Object.entries(docInfos)) {
      const doc = await docStore.getDocument(docId, false);
      if (doc && doc.metadata.file_name === id) {
        await docStore.deleteDocument(docId, false);
        break;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      {
        error: (error as Error).message || "Failed to delete document",
      },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 },
      );
    }

    if (action === "download") {
      const { docStore } = await getStorageContext();
      const docInfos = docStore.getAllRefDocInfo();

      let matchingDocument = null;
      for (const [docId] of Object.entries(docInfos)) {
        const doc = await docStore.getDocument(docId, false);
        if (doc && doc.metadata.file_name === id) {
          matchingDocument = doc;
          break;
        }
      }

      if (!matchingDocument) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 },
        );
      }

      const originalFileBase64 = matchingDocument.metadata.original_file_buffer as string;

      if (!originalFileBase64) {
        const textBuffer = Buffer.from("", "utf-8");
        const response = new NextResponse(new Uint8Array(textBuffer));
        response.headers.set("Content-Type", "text/plain");
        response.headers.set(
          "Content-Disposition",
          `attachment; filename="${id}"`,
        );
        response.headers.set("Content-Length", textBuffer.length.toString());
        return response;
      }

      const fileBuffer = Buffer.from(originalFileBase64, "base64");
      const fileName = matchingDocument.metadata.file_name as string;
      const fileType = matchingDocument.metadata.file_type as string;

      const response = new NextResponse(new Uint8Array(fileBuffer));
      response.headers.set("Content-Type", fileType);
      response.headers.set(
        "Content-Disposition",
        `attachment; filename="${fileName}"`,
      );
      response.headers.set("Content-Length", fileBuffer.length.toString());

      return response;
    }

    const coll = await getCollection();
    const results = await coll.get();

    const { metadatas } = results || {};
    if (!metadatas || metadatas.length === 0) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    const { ids } = results || {};
    const { file_name, file_type, upload_date } = metadatas[0] || {};
    return NextResponse.json({
      id,
      file_name,
      file_type,
      upload_date,
      chunk_count: ids?.length || 0,
    });
  } catch (error) {
    console.error("Error getting document:", error);
    return NextResponse.json(
      { error: "Failed to retrieve document information" },
      { status: 500 },
    );
  }
}
