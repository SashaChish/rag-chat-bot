import { type NextRequest, NextResponse } from "next/server";
import { initializeLlamaIndex } from "@/lib/llamaindex/utils";
import { executeQuery } from "@/lib/llamaindex/index";
import { hasDocuments } from "@/lib/llamaindex/vectorstore";
import type { ChatRequest, ChatStatusResponse } from "@/lib/types/api";
import type {
  QueryChunk,
  SourceNode,
  SourceInfo,
} from "@/lib/types/core.types";
import { extractSources } from "@/lib/llamaindex/sources";

initializeLlamaIndex();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as ChatRequest;
    const {
      message,
      conversationHistory = [],
      streaming = false,
      chatEngineType = "condense",
      sessionKey = null,
      systemPrompt = null,
    } = body;
    console.log(body);
    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const docsExist = await hasDocuments();

    if (!docsExist) {
      const noDocsMessage =
        "I don't have any documents to search through yet. Please upload some documents first, and then I can help answer your questions!";

      if (streaming) {
        const encoder = new TextEncoder();
        const noDocsStream = new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ response: noDocsMessage, sources: [] })}\n\n`,
              ),
            );
            controller.close();
          },
        });

        return new NextResponse(noDocsStream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
          },
        });
      } else {
        return NextResponse.json({
          response: noDocsMessage,
          sources: [],
        });
      }
    }

    const result = await executeQuery(
      message,
      streaming,
      conversationHistory,
      chatEngineType,
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
      } else {
        return NextResponse.json({ error: errorMsg }, { status: 500 });
      }
    }

    if (streaming) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          try {
            if (result.streaming && result.response) {
              const responseStream =
                result.response as AsyncGenerator<QueryChunk>;

              let extractedSources: SourceInfo[] = [];

              for await (const chunk of responseStream) {
                let text = "";

                if (typeof chunk === "string") {
                  text = chunk;
                } else if (chunk && typeof chunk === "object") {
                  const { message, delta, content } = chunk;

                  if (message?.content) {
                    text = String(message.content);
                  } else if (delta) {
                    text = delta;
                  } else if (content) {
                    text =
                      typeof content === "string" ? content : String(content);
                  }

                  if (
                    extractedSources.length === 0 &&
                    "sourceNodes" in chunk &&
                    chunk.sourceNodes
                  ) {
                    extractedSources = extractSources(
                      chunk.sourceNodes as SourceNode[],
                    );
                  }
                }

                if (text && text.length > 0) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ chunk: text })}\n\n`,
                    ),
                  );
                }
              }

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ done: true, sources: extractedSources })}\n\n`,
                ),
              );
            } else {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ response: result.response, sources: result.sources })}\n\n`,
                ),
              );
            }

            controller.close();
          } catch (error) {
            console.error("Error in streaming:", error);
            controller.error(error);
          }
        },
      });

      return new NextResponse(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      const response = {
        response: result.response as string,
        sources: result.sources,
      };

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process your request. Please try again." },
      { status: 500 },
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const docsExist = await hasDocuments();

    const response: ChatStatusResponse = {
      ready: docsExist,
      message: docsExist
        ? "Ready to answer questions"
        : "Please upload documents first",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in chat status check:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 },
    );
  }
}
