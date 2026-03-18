import { vi } from 'vitest';
import type { MockInstance } from 'vitest';

export function createMockFile(content: string, name: string, type: string = 'text/plain'): File {
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });
  Object.defineProperty(file, 'size', { value: content.length });
  return file;
}

export function createMockFormData(data: Record<string, string | File>): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value);
  }

  return formData;
}

export async function waitFor(condition: () => boolean, timeout = 5000, interval = 50): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

export function mockConsoleError(): MockInstance {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  return consoleErrorSpy;
}

export function restoreConsoleError(spy: MockInstance): void {
  spy.mockRestore();
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockBuffer(content: string): Buffer {
  return Buffer.from(content, 'utf-8');
}
