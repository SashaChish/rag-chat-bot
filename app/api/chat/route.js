/**
 * Chat API Route
 * Handles chat message requests using LlamaIndex.TS QueryEngine with streaming support
 */

import { NextRequest, NextResponse } from "next/server";
import { initializeLlamaIndex, validateQuery, formatSources } from "@/lib/llamaindex/utils.js";
import { executeQuery } from "@/lib/llamaindex/index.js";
import { hasDocuments } from "@/lib/llamaindex/vectorstore.js";
import { getSystemPrompt } from "@/lib/llamaindex/prompts.js";

// Initialize LlamaIndex on module load
initializeLlamaIndex();

/**
 * POST /api/chat
 * Handle chat message requests with optional streaming
 */
export async function POST(request) {
  try {
    const body = await request.json();
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

    // Validate chat engine type
    if (chatEngineType !== null && chatEngineType !== undefined) {
      const validChatEngineTypes = ["condense", "context"];
      if (!validChatEngineTypes.includes(chatEngineType)) {
        return NextResponse.json(
          { error: `Invalid chat engine type: ${chatEngineType}. Must be one of: ${validChatEngineTypes.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Validate agent type
    if (agentType !== null && agentType !== undefined) {
      const validAgentTypes = ["react", "openai"];
      if (!validAgentTypes.includes(agentType)) {
        return NextResponse.json(
          { error: `Invalid agent type: ${agentType}. Must be one of: ${validAgentTypes.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Check if there are documents indexed
    const docsExist = await hasDocuments();
    if (!docsExist) {
      // Return 200 OK with helpful message - no documents is not an error
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

    // Handle actual errors (500) vs expected conditions (200)
    if (result.error) {
      const errorMsg = typeof result.error === 'string' ? result.error : 'An error occurred';
      console.error("Query error:", errorMsg);
      
      if (streaming) {
        return new Response(
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

    // Handle streaming response
    if (streaming) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // Create a readable stream for the response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Collect sources from streaming chunks
            let collectedSources = [];

            // LlamaIndex.TS streaming response
            if (result.streaming && result.response) {
              // The streaming response from LlamaIndex.TS
              for await (const chunk of result.response) {
                // Extract text from chunk - handle different formats
                let text = "";

                if (typeof chunk === "string") {
                  text = chunk;
                } else if (chunk && typeof chunk === "object") {
                  // Chat engine response format (EngineResponse)
                  if (chunk.message && chunk.message.content) {
                    text = typeof chunk.message.content === "string"
                      ? chunk.message.content
                      : String(chunk.message.content);
                  } else {
                    // Query engine response format
                    text = chunk.delta || chunk.response || chunk.content ||
                           chunk.value || chunk.text || "";
                  }

                  // If still no text and chunk has toString method
                  if (!text && typeof chunk.toString === "function") {
                    const str = chunk.toString();
                    if (str && str !== "[object Object]") {
                      text = str;
                    }
                  }
                }

                // Handle chat engine responses (EngineResponse format)
                if (chunk.message && chunk.message.content) {
                  text = typeof chunk.message.content === "string"
                    ? chunk.message.content
                    : chunk.message.content;
                }

                // Extract sources from chunk if available
                if (chunk.sourceNodes && Array.isArray(chunk.sourceNodes)) {
                  const chunkSources = chunk.sourceNodes.map((nodeWithScore) => ({
                    filename: nodeWithScore.node.metadata?.file_name || "Unknown",
                    fileType: nodeWithScore.node.metadata?.file_type || "Unknown",
                    score: nodeWithScore.score !== undefined ? nodeWithScore.score.toFixed(3) : null,
                    preview: nodeWithScore.node.getContent().substring(0, 200) + "...",
                    metadata: nodeWithScore.node.metadata,
                  }));

                  // Update collected sources (last chunk has complete set)
                  if (chunkSources.length > 0) {
                    collectedSources = chunkSources;
                  }
                }

                if (text && typeof text === "string" && text.length > 0) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`));
                }
              }

              // Send done signal with collected sources
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, sources: collectedSources })}\n\n`));
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
