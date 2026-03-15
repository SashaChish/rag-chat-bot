import { NextRequest, NextResponse } from 'next/server';
import { initializeLlamaIndex } from '@/lib/core/llamaindex/core.utils';
import { validateQuery } from '@/lib/validators/query.validators';
import { formatSources } from '@/lib/utils/format.utils';
import { executeQuery } from '@/lib/llamaindex/index';
import { hasDocuments } from '@/lib/llamaindex/vectorstore';
import { getSystemPrompt } from '@/lib/llamaindex/prompts';
import type {
  ChatRequest,
  ChatResponse,
  ChatStatusResponse,
  ChatStreamChunk,
  ErrorResponse
} from '@/lib/types/api';
import type { SourceInfo, QueryChunk, SourceNode } from '@/lib/types/core.types';

initializeLlamaIndex();

/**
 * POST /api/chat
 * Handle chat message requests with optional streaming
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as ChatRequest;
    const {
      message,
      conversationHistory = [],
      streaming = false,
      queryEngineType = "default",
      chatEngineType = "condense",
      agentType = null,
      sessionKey = null,
      systemPrompt = null,
    } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    try {
      validateQuery(message);
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 400 }
      );
    }

    if (chatEngineType !== null && chatEngineType !== undefined) {
      const validChatEngineTypes = ["condense", "context"];
      if (!validChatEngineTypes.includes(chatEngineType)) {
        return NextResponse.json(
          { error: `Invalid chat engine type: ${chatEngineType}. Must be one of: ${validChatEngineTypes.join(", ")}` },
          { status: 400 }
        );
      }
    }

    if (agentType !== null && agentType !== undefined) {
      const validAgentTypes = ["react", "openai"];
      if (!validAgentTypes.includes(agentType)) {
        return NextResponse.json(
          { error: `Invalid agent type: ${agentType}. Must be one of: ${validAgentTypes.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const docsExist = await hasDocuments();
    if (!docsExist) {
      if (streaming) {
        return new NextResponse(
          JSON.stringify({
            response: "I don't have any documents to search through yet. Please upload some documents first, and then I can help answer your questions!",
            sources: [],
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        return NextResponse.json({
          response:
            "I don't have any documents to search through yet. Please upload some documents first, and then I can help answer your questions!",
          sources: [],
        });
      }
    }

    const result = await executeQuery(
      message,
      streaming,
      "documents",
      queryEngineType,
      conversationHistory,
      chatEngineType,
      agentType,
      sessionKey,
      systemPrompt,
    );

    if (result.error) {
      const errorMsg = typeof result.error === 'string' ? result.error : 'An error occurred';
      console.error("Query error:", errorMsg);

      if (streaming) {
        return new NextResponse(
          JSON.stringify({ error: errorMsg }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        return NextResponse.json(
          { error: errorMsg },
          { status: 500 }
        );
      }
    }

    if (streaming) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const stream = new ReadableStream({
        async start(controller) {
          try {
            let collectedSources: SourceInfo[] = [];

            if (result.streaming && result.response) {
              const responseStream = result.response as AsyncGenerator<QueryChunk>;

              for await (const chunk of responseStream) {
                let text = "";

                if (typeof chunk === "string") {
                  text = chunk;
                } else if (chunk && typeof chunk === "object") {
                  if (chunk.message && chunk.message.content) {
                    text = typeof chunk.message.content === "string"
                      ? chunk.message.content
                      : String(chunk.message.content);
                  } else {
                    text = chunk.delta || chunk.response || chunk.content ||
                           chunk.value || chunk.text || "";
                  }

                  if (!text && typeof chunk.toString === "function") {
                    const str = chunk.toString();
                    if (str && str !== "[object Object]") {
                      text = str;
                    }
                  }
                }

                if (chunk.message && chunk.message.content) {
                  text = typeof chunk.message.content === 'string'
                    ? chunk.message.content
                    : JSON.stringify(chunk.message.content);
                }

                if (chunk.sourceNodes && Array.isArray(chunk.sourceNodes)) {
                  const chunkSources = chunk.sourceNodes.map((nodeWithScore: SourceNode) => ({
                    filename: nodeWithScore.node.metadata?.file_name || "Unknown",
                    fileType: nodeWithScore.node.metadata?.file_type || "Unknown",
                    score: nodeWithScore.score !== undefined ? parseFloat(nodeWithScore.score.toFixed(3)) : 0,
                    preview: nodeWithScore.node.getContent().substring(0, 200) + "...",
                    metadata: nodeWithScore.node.metadata,
                  }));

                  if (chunkSources.length > 0) {
                    collectedSources = chunkSources;
                  }
                }

                if (text && typeof text === "string" && text.length > 0) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`));
                }
              }

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, sources: collectedSources })}\n\n`));
            } else {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: result.response, sources: result.sources })}\n\n`));
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
          "Connection": "keep-alive",
        },
      });
    } else {
      const response: ChatResponse = {
        response: result.response as string,
        sources: result.sources,
      };

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process your request. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
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
      { status: 500 }
    );
  }
}