import type { DocumentMetadata } from '@/lib/types/core.types';
import type { DocumentEntry } from '@/lib/db/types';

/**
 * Create a mock DocumentEntry object with all required properties
 */
export function createMockDocumentEntry(overrides: Partial<DocumentEntry> = {}): DocumentEntry {
  return {
    id: 'test-id',
    filename: 'test.txt',
    fileType: 'text/plain',
    uploadDate: '2024-01-15T10:30:00Z',
    chunkCount: 5,
    content: 'Test content',
    fileSize: 1024,
    ...overrides,
  };
}

/**
 * Create a mock DocumentMetadata object with all required properties
 */
export function createMockDocumentMetadata(overrides: Partial<DocumentMetadata> = {}): DocumentMetadata {
  return {
    file_name: 'test.txt',
    file_type: 'text/plain',
    upload_date: '2024-01-15T10:30:00Z',
    ...overrides,
  };
}

/**
 * Create multiple mock DocumentEntry objects
 */
export function createMockDocumentEntryList(count: number, overrides: Partial<DocumentEntry>[] = []): DocumentEntry[] {
  return Array.from({ length: count }, (_, i) =>
    createMockDocumentEntry({
      id: `doc-${i}`,
      filename: `doc${i}.txt`,
      content: `Content ${i}`,
      ...overrides[i],
    })
  );
}
