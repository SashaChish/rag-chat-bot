/**
 * Chat API Route
 * Handles chat message requests using LlamaIndex.TS QueryEngine with streaming support
 */

import { NextRequest, NextResponse } from "next/server";
import { initializeLlamaIndex, validateQuery, formatSources } from "@/lib/llamaindex/utils.js";
import { executeQuery, getQueryEngine } from "@/lib/llamaindex/index.js";
import { hasDocuments } from "@/lib/llamaindex/utils.js";

// Initialize LlamaIndex on module load
initializeLlamaIndex();

/**
 * POST /api/chat
 * Handle chat message requests with optional streaming
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { message, conversationHistory = [], streaming = false } = body;

    // Validate input
    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Validate query
    try {
      validateQuery(message);
    } catch (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Check if there are documents indexed
    const docsExist = await hasDocuments();
    if (!docsExist) {
      if (streaming) {
        return new Response(
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

    // Execute query using LlamaIndex.TS with streaming
    const result = await executeQuery(message, streaming);

    if (result.error) {
      if (streaming) {
        return new Response(
          JSON.stringify({ error: result.error }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
    }

    // Handle streaming response
    if (streaming) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // Create a readable stream for the response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // LlamaIndex.TS streaming response
            if (result.streaming && result.response) {
              // The streaming response from LlamaIndex.TS
              for await (const chunk of result.response) {
                // Extract text from chunk - handle different formats
                let text = "";
                if (typeof chunk === "string") {
                  text = chunk;
                } else if (chunk && typeof chunk === "object") {
                  // Try common properties: delta, response, content, message.content
                  text = chunk.delta || chunk.response || chunk.content || 
                         (chunk.message && chunk.message.content) || "";
                }
                
                if (text && typeof text === "string") {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`));
                }
              }

              // Send done signal with sources
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, sources: result.sources })}\n\n`));
            } else {
              // Non-streaming fallback
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: result.response, sources: result.sources })}\n\n`));
            }

            controller.close();
          } catch (error) {
            console.error("Error in streaming:", error);
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    } else {
      // Non-streaming response
      return NextResponse.json({
        response: result.response,
        sources: result.sources,
      });
    }
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process your request. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat
 * Check chat status (e.g., whether documents are indexed)
 */
export async function GET(request) {
  try {
    const docsExist = await hasDocuments();

    return NextResponse.json({
      ready: docsExist,
      message: docsExist
        ? "Ready to answer questions"
        : "Please upload documents first",
    });
  } catch (error) {
    console.error("Error in chat status check:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
