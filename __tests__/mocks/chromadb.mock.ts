import { beforeEach, vi } from 'vitest';

export const mockCollection = {
  count: vi.fn().mockResolvedValue(10),
  get: vi.fn().mockResolvedValue([]),
  add: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  peek: vi.fn().mockResolvedValue([]),
  modify: vi.fn().mockResolvedValue(undefined),
};

export const mockChromaVectorStore = {
  client: {
    getOrCreateCollection: vi.fn().mockResolvedValue(mockCollection),
    getCollection: vi.fn().mockResolvedValue(mockCollection),
    deleteCollection: vi.fn().mockResolvedValue(undefined),
  },
  collection: mockCollection,
};

export const mockCollectionStats = {
  totalDocuments: 10,
  documentIds: ['doc-1', 'doc-2', 'doc-3'],
  filenames: ['test1.txt', 'test2.txt', 'test3.txt'],
};

beforeEach(() => {
  mockCollection.count.mockResolvedValue(mockCollectionStats.totalDocuments);
  mockCollection.get.mockResolvedValue(
    mockCollectionStats.documentIds.map((id) => ({
      id,
      metadata: { filename: mockCollectionStats.filenames[mockCollectionStats.documentIds.indexOf(id)] },
    }))
  );
});
