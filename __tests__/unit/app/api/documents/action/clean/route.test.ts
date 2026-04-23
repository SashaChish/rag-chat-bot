import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { NextRequest } from 'next/server';
import { POST } from '@/app/api/documents/action/clean/route';

vi.mock('@/lib/mastra/vectorstore', () => ({
  getAllDocuments: vi.fn(),
  deleteDocumentByName: vi.fn(),
}));

vi.mock('@/lib/mastra/index', () => ({
  clearIndex: vi.fn(),
}));

const createMockRequest = (body: unknown): NextRequest => {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
};

describe('/api/documents/action/clean', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('should return 400 when action is missing', async () => {
      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Action is required');
    });

    it('should list documents with list action', async () => {
      const { getAllDocuments } = await import('@/lib/mastra/vectorstore');
      vi.mocked(getAllDocuments).mockResolvedValue({
        documents: [
          {
            file_name: 'doc1.txt',
            file_type: 'txt',
            chunk_count: 3,
            upload_date: '2024-01-01T00:00:00Z',
            first_chunk_id: 'chunk-1',
          },
        ],
        total_chunks: 3,
      });

      const request = createMockRequest({ action: 'list' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.documents).toHaveLength(1);
      expect(data.total_chunks).toBe(3);
    });

    it('should return 400 for delete action without fileNames', async () => {
      const request = createMockRequest({ action: 'delete' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('fileNames array is required for delete action');
    });

    it('should return 400 for delete action with empty fileNames', async () => {
      const request = createMockRequest({ action: 'delete', fileNames: [] });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('fileNames array is required for delete action');
    });

    it('should delete documents and return results', async () => {
      const { deleteDocumentByName } = await import('@/lib/mastra/vectorstore');
      const { clearIndex } = await import('@/lib/mastra/index');

      vi.mocked(deleteDocumentByName)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2);
      vi.mocked(clearIndex).mockResolvedValue({ success: true });

      const request = createMockRequest({
        action: 'delete',
        fileNames: ['doc1.txt', 'doc2.txt'],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.total_deleted_chunks).toBe(5);
      expect(data.results).toHaveLength(2);
    });

    it('should handle partial delete failures', async () => {
      const { deleteDocumentByName } = await import('@/lib/mastra/vectorstore');
      const { clearIndex } = await import('@/lib/mastra/index');

      vi.mocked(deleteDocumentByName)
        .mockResolvedValueOnce(3)
        .mockRejectedValueOnce(new Error('Delete failed'));
      vi.mocked(clearIndex).mockResolvedValue({ success: true });

      const request = createMockRequest({
        action: 'delete',
        fileNames: ['doc1.txt', 'doc2.txt'],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.results[0].success).toBe(true);
      expect(data.results[1].success).toBe(false);
      expect(data.results[1].error).toBe('Delete failed');
    });

    it('should clear all documents with clear action', async () => {
      const { clearIndex } = await import('@/lib/mastra/index');
      vi.mocked(clearIndex).mockResolvedValue({ success: true });

      const request = createMockRequest({ action: 'clear' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toBe('All documents cleared from ChromaDB and collection recreated');
    });

    it('should handle clear failure', async () => {
      const { clearIndex } = await import('@/lib/mastra/index');
      vi.mocked(clearIndex).mockResolvedValue({
        success: false,
        error: 'Clear failed',
      });

      const request = createMockRequest({ action: 'clear' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('Clear failed');
    });

    it('should return 400 for invalid action', async () => {
      const request = createMockRequest({ action: 'invalid' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid action');
    });

    it('should handle unexpected errors', async () => {
      const request = {
        json: vi.fn().mockRejectedValue(new Error('Parse error')),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to process cleanup request');
    });
  });
});
