import { type NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import { clearCollection } from "@/lib/mastra/vectorstore";

async function clearAll(_request: NextRequest): Promise<NextResponse> {
  await clearCollection();

  return NextResponse.json({
    success: true,
    message: "All documents cleared successfully",
  });
}

export const POST = withErrorHandler(clearAll);
