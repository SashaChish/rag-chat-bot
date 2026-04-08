import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockCollection = {
  count: vi.fn().mockResolvedValue(10),
  get: vi.fn().mockResolvedValue({ ids: [], metadatas: [], documents: [] }),
  delete: vi.fn().mockResolvedValue(undefined),
};

class MockChromaVectorStore {
  getCollection = vi.fn().mockResolvedValue(mockCollection);
}

vi.mock('@llamaindex/chroma', () => ({
  ChromaVectorStore: MockChromaVectorStore,
}));

vi.mock('chromadb', () => ({
  IncludeEnum: {
    Documents: 'documents',
    Embeddings: 'embeddings',
    Metadatas: 'metadatas',
    Distances: 'distances',
  },
}));

vi.mock('llamaindex', () => ({
  storageContextFromDefaults: vi.fn().mockResolvedValue({
    vectorStores: {
      TEXT: {},
    },
  }),
}));

describe('vectorstore', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('getChromaVectorStore', () => {
    it('should return a ChromaVectorStore instance', async () => {
      const { getChromaVectorStore } = await import('@/lib/llamaindex/vectorstore');

      const result = await getChromaVectorStore();

      expect(result).toBeDefined();
      expect(typeof result.getCollection).toBe('function');
    });
  });

  describe('getCollection', () => {
    it('should return collection from ChromaVectorStore', async () => {
      const { getCollection } = await import('@/lib/llamaindex/vectorstore');

      const result = await getCollection();

      expect(result).toBeDefined();
      expect(typeof result.count).toBe('function');
    });
  });

  describe('hasDocuments', () => {
    it('should return true when documents exist', async () => {
      mockCollection.count.mockResolvedValueOnce(5);
      const { hasDocuments } = await import('@/lib/llamaindex/vectorstore');

      const result = await hasDocuments();

      expect(result).toBe(true);
    });

    it('should return false when no documents exist', async () => {
      mockCollection.count.mockResolvedValueOnce(0);
      const { hasDocuments } = await import('@/lib/llamaindex/vectorstore');

      const result = await hasDocuments();

      expect(result).toBe(false);
    });

    it('should return false when error occurs', async () => {
      mockCollection.count.mockRejectedValueOnce(new Error('Connection error'));
      const { hasDocuments } = await import('@/lib/llamaindex/vectorstore');

      const result = await hasDocuments();

      expect(result).toBe(false);
    });
  });

  describe('clearCollection', () => {
    it('should return success when clearing documents', async () => {
      mockCollection.get.mockResolvedValueOnce({ ids: ['id1', 'id2'], documents: ['doc1', 'doc2'] });
      const { clearCollection } = await import('@/lib/llamaindex/vectorstore');

      const result = await clearCollection();

      expect(result.success).toBe(true);
    });

    it('should return success when collection is empty', async () => {
      mockCollection.get.mockResolvedValueOnce({ ids: [], documents: [] });
      const { clearCollection } = await import('@/lib/llamaindex/vectorstore');

      const result = await clearCollection();

      expect(result.success).toBe(true);
    });

    it('should return error when clearing fails', async () => {
      mockCollection.get.mockRejectedValueOnce(new Error('Clear failed'));
      const { clearCollection } = await import('@/lib/llamaindex/vectorstore');

      const result = await clearCollection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Clear failed');
    });
  });

  describe('deleteDocument', () => {
    it('should return success when document is deleted', async () => {
      mockCollection.get.mockResolvedValueOnce({ ids: ['chunk1', 'chunk2'], metadatas: [] });
      const { deleteDocument } = await import('@/lib/llamaindex/vectorstore');

      const result = await deleteDocument('test.txt');

      expect(result.success).toBe(true);
      expect(result.chunksDeleted).toBe(2);
    });

    it('should return success with 0 chunks when document not found', async () => {
      mockCollection.get.mockResolvedValueOnce({ ids: [], metadatas: [] });
      const { deleteDocument } = await import('@/lib/llamaindex/vectorstore');

      const result = await deleteDocument('nonexistent.txt');

      expect(result.success).toBe(true);
      expect(result.chunksDeleted).toBe(0);
    });

    it('should return error when deletion fails', async () => {
      mockCollection.get.mockRejectedValueOnce(new Error('Delete failed'));
      const { deleteDocument } = await import('@/lib/llamaindex/vectorstore');

      const result = await deleteDocument('test.txt');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed');
    });
  });

  describe('getCollectionStats', () => {
    it('should return collection statistics', async () => {
      mockCollection.count.mockResolvedValueOnce(10);
      const { getCollectionStats } = await import('@/lib/llamaindex/vectorstore');

      const result = await getCollectionStats('custom-collection');

      expect(result).toHaveProperty('exists');
      expect(result).toHaveProperty('collectionName');
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('documentCount');
    });

    it('should use default collection name when not provided', async () => {
      const { getCollectionStats } = await import('@/lib/llamaindex/vectorstore');

      const result = await getCollectionStats();

      expect(result.collectionName).toBe('documents');
    });

    it('should return exists false when collection not found', async () => {
      mockCollection.count.mockRejectedValueOnce(new Error('Collection not found'));
      const { getCollectionStats } = await import('@/lib/llamaindex/vectorstore');

      const result = await getCollectionStats('missing-collection');

      expect(result.exists).toBe(false);
      expect(result.count).toBe(0);
    });
  });

  describe('getAllDocuments', () => {
    it('should return documents object with documents array', async () => {
      const { getAllDocuments } = await import('@/lib/llamaindex/vectorstore');

      const result = await getAllDocuments();

      expect(result).toHaveProperty('documents');
      expect(result).toHaveProperty('total_chunks');
      expect(Array.isArray(result.documents)).toBe(true);
      expect(typeof result.total_chunks).toBe('number');
    });

    it('should handle null metadata values', async () => {
      mockCollection.get.mockResolvedValueOnce({
        ids: ['id1'],
        metadatas: [null],
      });
      const { getAllDocuments } = await import('@/lib/llamaindex/vectorstore');

      const result = await getAllDocuments();

      expect(result.documents).toHaveLength(0);
    });

    it('should handle missing metadata fields', async () => {
      mockCollection.get.mockResolvedValueOnce({
        ids: ['id1'],
        metadatas: [{ file_name: 123, file_type: 456, upload_date: 789 }],
      });
      const { getAllDocuments } = await import('@/lib/llamaindex/vectorstore');

      const result = await getAllDocuments();

      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].file_name).toBe('unknown');
      expect(result.documents[0].file_type).toBe('unknown');
      expect(result.documents[0].upload_date).toBeNull();
    });

    it('should return empty result when getAllDocuments fails', async () => {
      mockCollection.get.mockRejectedValueOnce(new Error('Database error'));
      const { getAllDocuments } = await import('@/lib/llamaindex/vectorstore');

      const result = await getAllDocuments();
      expect(result).toEqual({ documents: [], total_chunks: 0 });
    });

    it('should return empty array when no metadatas', async () => {
      mockCollection.get.mockResolvedValueOnce({
        ids: [],
        metadatas: [],
      });
      const { getAllDocuments } = await import('@/lib/llamaindex/vectorstore');

      const result = await getAllDocuments();

      expect(result.documents).toHaveLength(0);
      expect(result.total_chunks).toBe(0);
    });
  });

  describe('deleteDocumentByName', () => {
    it('should return number of deleted chunks', async () => {
      mockCollection.get.mockResolvedValueOnce({ ids: ['chunk1', 'chunk2'] });
      const { deleteDocumentByName } = await import('@/lib/llamaindex/vectorstore');

      const result = await deleteDocumentByName('test.txt');

      expect(result).toBe(2);
    });

    it('should return 0 when no documents found', async () => {
      mockCollection.get.mockResolvedValueOnce({ ids: [] });
      const { deleteDocumentByName } = await import('@/lib/llamaindex/vectorstore');

      const result = await deleteDocumentByName('nonexistent.txt');

      expect(result).toBe(0);
    });

    it('should throw error when deletion fails', async () => {
      mockCollection.get.mockRejectedValueOnce(new Error('Database error'));
      const { deleteDocumentByName } = await import('@/lib/llamaindex/vectorstore');

      await expect(deleteDocumentByName('test.txt')).rejects.toThrow('Failed to delete document');
    });
  });
});
