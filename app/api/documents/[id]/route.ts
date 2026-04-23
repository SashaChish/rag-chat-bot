import { type NextRequest, NextResponse } from "next/server";
import { deleteDocument } from "@/lib/mastra/index";
import { getDocumentContent, getCollectionStats } from "@/lib/mastra/vectorstore";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;

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
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 },
      );
    }

    if (action === "download") {
      const content = await getDocumentContent(id);

      if (!content) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 },
        );
      }

      const textBuffer = Buffer.from(content, "utf-8");
      const response = new NextResponse(new Uint8Array(textBuffer));
      response.headers.set("Content-Type", "text/plain");
      response.headers.set(
        "Content-Disposition",
        `attachment; filename="${id}"`,
      );
      response.headers.set("Content-Length", textBuffer.length.toString());
      return response;
    }

    const stats = await getCollectionStats();

    return NextResponse.json({
      id,
      exists: stats.exists,
      chunk_count: stats.count,
    });
  } catch (error) {
    console.error("Error getting document:", error);
    return NextResponse.json(
      { error: "Failed to retrieve document information" },
      { status: 500 },
    );
  }
}
