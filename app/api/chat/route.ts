import { type NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import { validateBody } from "@/lib/api/validate";
import { chatRequestSchema } from "@/lib/api/schemas";
import { executeQuery } from "@/lib/mastra/index";
import { hasDocuments } from "@/lib/mastra/vectorstore";
import { createSSEStream, createSSEResponse } from "@/lib/api/streaming";
import type { QueryChunk, SourceInfo } from "@/lib/types/core.types";

async function postChat(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.json();
  const {
    message,
    conversationHistory = [],
    streaming = false,
    sessionKey = null,
    systemPrompt = null,
  } = validateBody(chatRequestSchema, rawBody);

  const docsExist = await hasDocuments();

  const noDocsMessage =
    "I don't have any documents to search through yet. Please upload some documents first, and then I can help answer your questions!";

  if (!docsExist) {
    if (streaming) {
      const stream = createSSEStream(async function* () {
        yield JSON.stringify({ response: noDocsMessage, sources: [] });
      });
      return createSSEResponse(stream);
    }

    return NextResponse.json({
      response: noDocsMessage,
      sources: [],
    });
  }

  const result = await executeQuery(
    message,
    streaming,
    conversationHistory,
    sessionKey,
    systemPrompt,
  );

  if (result.error) {
    const errorMsg =
      typeof result.error === "string" ? result.error : "An error occurred";
    console.error("Query error:", errorMsg);

    if (streaming) {
      return new NextResponse(JSON.stringify({ error: errorMsg }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return NextResponse.json(
      { error: { code: "QUERY_FAILED" as const, message: errorMsg } },
      { status: 500 },
    );
  }

  if (streaming) {
    const stream = createSSEStream(async function* () {
      if (result.streaming && result.response) {
        const responseStream = result.response as AsyncGenerator<QueryChunk>;
        let extractedSources: SourceInfo[] = [];

        for await (const chunk of responseStream) {
          if (chunk.done) {
            extractedSources = chunk.sources ?? [];
            continue;
          }

          const text = chunk.delta ?? "";
          if (text.length > 0) {
            yield JSON.stringify({ chunk: text });
          }
        }

        yield JSON.stringify({ done: true, sources: extractedSources });
      } else {
        yield JSON.stringify({
          response: result.response,
          sources: result.sources,
        });
      }
    });
    return createSSEResponse(stream);
  }

  return NextResponse.json({
    response: result.response as string,
    sources: result.sources,
  });
}

export const POST = withErrorHandler(postChat);
