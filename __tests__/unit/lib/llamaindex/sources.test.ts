import { describe, it, expect, vi } from 'vitest';
import { extractSources } from '@/lib/llamaindex/sources';
import type { SourceNode, DocumentMetadata } from '@/lib/types/core.types';

function createMockSourceNode(overrides: {
  metadata?: Partial<DocumentMetadata>;
  content?: string;
  score?: number;
} = {}): SourceNode {
  const defaultMetadata: DocumentMetadata = {
    file_name: 'test.txt',
    file_type: 'txt',
    upload_date: '2026-03-17',
  };

  const mockNode = {
    id: 'test-node-id',
    metadata: { ...defaultMetadata, ...overrides.metadata },
    getContent: vi.fn().mockReturnValue(overrides.content ?? 'Test content'),
  };

  return {
    node: mockNode as unknown as SourceNode['node'],
    score: overrides.score ?? 0.9,
  };
}

describe('extractSources', () => {
  it('should return empty array for undefined source nodes', () => {
    const result = extractSources(undefined);
    expect(result).toEqual([]);
  });

  it('should return empty array for empty source nodes array', () => {
    const result = extractSources([]);
    expect(result).toEqual([]);
  });

  it('should extract source information from single source node', () => {
    const sourceNodes: SourceNode[] = [
      createMockSourceNode({ score: 0.95, content: 'Test content' }),
    ];

    const result = extractSources(sourceNodes);

    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('test.txt');
    expect(result[0].fileType).toBe('txt');
    expect(result[0].score).toBe(0.95);
    expect(result[0].text).toBe('Test content...');
  });

  it('should handle multiple source nodes', () => {
    const sourceNodes: SourceNode[] = [
      createMockSourceNode({
        metadata: { file_name: 'test1.txt', file_type: 'txt', upload_date: '2026-03-17' },
        content: 'Content 1',
        score: 0.9,
      }),
      createMockSourceNode({
        metadata: { file_name: 'test2.pdf', file_type: 'pdf', upload_date: '2026-03-17' },
        content: 'Content 2',
        score: 0.8,
      }),
    ];

    const result = extractSources(sourceNodes);

    expect(result).toHaveLength(2);
    expect(result[0].filename).toBe('test1.txt');
    expect(result[1].filename).toBe('test2.pdf');
  });

  it('should handle missing filename metadata', () => {
    const mockNode = {
      id: 'test-node-id',
      metadata: { file_type: 'txt', upload_date: '2026-03-17' },
      getContent: vi.fn().mockReturnValue('Test content'),
    };

    const sourceNodes: SourceNode[] = [
      {
        node: mockNode as unknown as SourceNode['node'],
        score: 0.9,
      },
    ];

    const result = extractSources(sourceNodes);

    expect(result[0].filename).toBe('Unknown');
  });

  it('should handle missing file_type metadata', () => {
    const mockNode = {
      id: 'test-node-id',
      metadata: { file_name: 'test.txt', upload_date: '2026-03-17' },
      getContent: vi.fn().mockReturnValue('Test content'),
    };

    const sourceNodes: SourceNode[] = [
      {
        node: mockNode as unknown as SourceNode['node'],
        score: 0.9,
      },
    ];

    const result = extractSources(sourceNodes);

    expect(result[0].fileType).toBe('Unknown');
  });

  it('should handle missing score', () => {
    const mockNode = {
      id: 'test-node-id',
      metadata: { file_name: 'test.txt', file_type: 'txt', upload_date: '2026-03-17' },
      getContent: vi.fn().mockReturnValue('Test content'),
    };

    const sourceNodes: SourceNode[] = [
      {
        node: mockNode as unknown as SourceNode['node'],
        score: undefined,
      },
    ];

    const result = extractSources(sourceNodes);

    expect(result[0].score).toBe(0);
  });

  it('should round score to 3 decimal places', () => {
    const sourceNodes: SourceNode[] = [
      createMockSourceNode({ score: 0.956789 }),
    ];

    const result = extractSources(sourceNodes);

    expect(result[0].score).toBe(0.957);
  });

  it('should truncate content preview to 200 characters', () => {
    const longContent = 'A'.repeat(300);
    const sourceNodes: SourceNode[] = [
      createMockSourceNode({ content: longContent }),
    ];

    const result = extractSources(sourceNodes);

    expect(result[0].text).toBe('A'.repeat(200) + '...');
  });

  it('should handle content without getContent method', () => {
    const mockNode = {
      id: 'test-node-id',
      metadata: {
        file_name: 'test.txt',
        file_type: 'txt',
        upload_date: '2026-03-17',
      },
    };

    const sourceNodes: SourceNode[] = [
      {
        node: mockNode as unknown as SourceNode['node'],
        score: 0.9,
      },
    ];

    const result = extractSources(sourceNodes);

    expect(result[0].text).toBe('...');
  });

  it('should include all metadata in result', () => {
    const metadata: DocumentMetadata = {
      file_name: 'test.txt',
      file_type: 'txt',
      file_size: 1024,
      upload_date: '2026-03-17',
    };
    const sourceNodes: SourceNode[] = [
      createMockSourceNode({ metadata }),
    ];

    const result = extractSources(sourceNodes);

    expect(result[0].metadata).toEqual(metadata);
  });
});
