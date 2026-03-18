import type { DocumentListEntry } from '@/lib/types/core.types';
import type { DocumentMetadata } from '@/lib/types/core.types';

/**
 * Create a mock DocumentListEntry object with all required properties
 */
export function createMockDocumentListEntry(overrides: Partial<DocumentListEntry> = {}): DocumentListEntry {
  return {
    id: 'test-id',
    file_name: 'test.txt',
    file_type: 'text/plain',
    upload_date: '2024-01-15T10:30:00Z',
    chunk_count: 5,
    content: 'Test content',
    file_size: '1024',
    can_download: true,
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
 * Create multiple mock DocumentListEntry objects
 */
export function createMockDocumentListEntryList(count: number, overrides: Partial<DocumentListEntry>[] = []): DocumentListEntry[] {
  return Array.from({ length: count }, (_, i) =>
    createMockDocumentListEntry({
      id: `doc-${i}`,
      file_name: `doc${i}.txt`,
      content: `Content ${i}`,
      ...overrides[i],
    })
  );
}
