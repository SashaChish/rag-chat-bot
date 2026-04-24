import { NextResponse } from "next/server";

export function createSSEStream(
  generator: () => AsyncGenerator<string>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of generator()) {
          controller.enqueue(encoder.encode(`data: ${event}\n\n`));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

export function createSSEResponse(
  stream: ReadableStream<Uint8Array>,
): NextResponse {
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
