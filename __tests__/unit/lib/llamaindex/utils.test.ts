import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/llamaindex/settings', () => ({
  initializeSettings: vi.fn(),
}));

describe('utils', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('initializeLlamaIndex', () => {
    it('should initialize settings and return true', async () => {
      const { initializeLlamaIndex } = await import('@/lib/llamaindex/utils');
      const { initializeSettings } = await import('@/lib/llamaindex/settings');

      const result = initializeLlamaIndex();

      expect(initializeSettings).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should log success message', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      const { initializeLlamaIndex } = await import('@/lib/llamaindex/utils');

      initializeLlamaIndex();

      expect(consoleLogSpy).toHaveBeenCalledWith('LlamaIndex.TS settings initialized');
    });

    it('should throw and log error when initializeSettings fails', async () => {
      const { initializeSettings } = await import('@/lib/llamaindex/settings');
      const error = new Error('Initialization failed');
      vi.mocked(initializeSettings).mockImplementation(() => {
        throw error;
      });

      const consoleErrorSpy = vi.spyOn(console, 'error');
      vi.resetModules();

      const { initializeLlamaIndex: initializeLlamaIndexFresh } = await import('@/lib/llamaindex/utils');

      expect(() => initializeLlamaIndexFresh()).toThrow('Initialization failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize LlamaIndex.TS:',
        error
      );
    });
  });

  describe('generateDocumentId', () => {
    it('should generate unique document IDs', async () => {
      const { generateDocumentId } = await import('@/lib/llamaindex/utils');

      const id1 = generateDocumentId('test.txt');
      const id2 = generateDocumentId('test.txt');

      expect(id1).not.toBe(id2);
    });

    it('should include filename in ID', async () => {
      const { generateDocumentId } = await import('@/lib/llamaindex/utils');

      const id = generateDocumentId('document.pdf');

      expect(id).toContain('document.pdf');
    });

    it('should include timestamp in ID', async () => {
      const { generateDocumentId } = await import('@/lib/llamaindex/utils');

      const beforeTime = Date.now();
      const id = generateDocumentId('test.txt');
      const afterTime = Date.now();

      const timestampMatch = id.match(/-(\d+)-/);
      expect(timestampMatch).not.toBeNull();

      const timestamp = parseInt(timestampMatch![1], 10);
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should include random component in ID', async () => {
      const { generateDocumentId } = await import('@/lib/llamaindex/utils');

      const id = generateDocumentId('test.txt');

      const parts = id.split('-');
      expect(parts.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle filenames with special characters', async () => {
      const { generateDocumentId } = await import('@/lib/llamaindex/utils');

      const id = generateDocumentId('test file (1).txt');

      expect(id).toContain('test file (1).txt');
    });

    it('should handle empty filename', async () => {
      const { generateDocumentId } = await import('@/lib/llamaindex/utils');

      const id = generateDocumentId('');

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate consistent format', async () => {
      const { generateDocumentId } = await import('@/lib/llamaindex/utils');

      const id = generateDocumentId('doc.pdf');
      const pattern = /^doc\.pdf-\d+-[a-z0-9]+$/;

      expect(pattern.test(id)).toBe(true);
    });
  });
});
