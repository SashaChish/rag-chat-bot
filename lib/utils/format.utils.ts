/**
 * Format Utility Functions
 * Helper functions for formatting values
 */

import type { SourceInfo } from '../types/core.types';

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format sources by removing duplicates and sorting by score
 */
export function formatSources(sources: SourceInfo[]): SourceInfo[] {
  if (!sources || sources.length === 0) {
    return [];
  }

  const uniqueSources: SourceInfo[] = [];
  const seenFilenames = new Set<string>();

  for (const source of sources) {
    if (!seenFilenames.has(source.filename)) {
      uniqueSources.push({
        filename: source.filename,
        fileType: source.fileType,
        score: source.score,
        text: source.text,
        preview: source.preview || source.text,
      });
      seenFilenames.add(source.filename);
    }
  }

  return uniqueSources.sort((a, b) => b.score - a.score);
}

/**
 * Chunk text to a maximum length with ellipsis
 */
export function chunkText(text: string, maxLength = 200): string {
  if (!text || text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + '...';
}
