import { ReadableStream } from 'node:stream/web';

export function createMockReadableStream(chunks: string[]): ReadableStream<string> {
  let index = 0;

  return new ReadableStream<string>({
    start(controller) {
      function push() {
        if (index < chunks.length) {
          controller.enqueue(chunks[index]);
          index++;
          setTimeout(push, 10);
        } else {
          controller.close();
        }
      }
      push();
    },
  });
}

export function createMockSSEStream(content: string): ReadableStream<string> {
  const lines = content.split('\n');
  return createMockReadableStream(lines);
}

export const mockSSEChunk = 'data: {"choices":[{"delta":{"content":"test"}}]}\n\n';
export const mockSSEEnd = 'data: [DONE]\n\n';

export function createMockStreamReader() {
  const chunks = [
    'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
    'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
    'data: {"choices":[{"delta":{"content":"!"}}]}\n\n',
    'data: [DONE]\n\n',
  ];

  return createMockReadableStream(chunks).getReader();
}

export async function readAllChunks(reader: ReadableStreamDefaultReader<string>): Promise<string[]> {
  const chunks: string[] = [];
  let result: ReadableStreamReadResult<string>;

  while (!(result = await reader.read()).done) {
    chunks.push(result.value);
  }

  return chunks;
}
