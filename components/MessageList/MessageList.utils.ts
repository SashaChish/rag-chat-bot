/**
 * MessageList Component Utilities
 * Helper functions specific to the MessageList component
 */

import type { SourceInfo } from '../../lib/types/core.types';
import type { SourceExplanation } from './MessageList.types';

/**
 * Format message content with markdown-like syntax
 */
export function formatContent(content: string): string {
  if (!content) return '';

  // Handle bold text
  let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Handle italic text
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Handle code blocks
  formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Handle inline code
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Handle line breaks
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

/**
 * Get source explanation text
 */
export function getSourceExplanation(sources?: SourceInfo[]): SourceExplanation | null {
  if (!sources || sources.length === 0) {
    return null;
  }

  const uniqueFilenames = [
    ...new Set(sources.map((s) => s.filename)),
  ];

  if (uniqueFilenames.length === 1) {
    const filename = uniqueFilenames[0];
    const chunks = sources.length;
    return {
      text: `${chunks} chunk${chunks !== 1 ? 's' : ''} from "${filename}" matched your query based on semantic similarity`,
      chunks,
      documents: 1,
    };
  }

  const docs = uniqueFilenames.length;
  return {
    text: `${docs} document${docs !== 1 ? 's' : ''} matched your query based on semantic similarity`,
    chunks: sources.length,
    documents: docs,
  };
}

/**
 * Get color for similarity score
 */
export function getSimilarityColor(score: number): string {
  if (score >= 0.7) return '#10b981'; // Green
  if (score >= 0.4) return '#f59e0b'; // Yellow/orange
  return '#9ca3af'; // Gray
}

/**
 * Get percentage from similarity score
 */
export function getSimilarityPercentage(score: string | number): number {
  const numericScore = typeof score === 'string' ? parseFloat(score) : score;
  if (isNaN(numericScore) || numericScore === undefined || numericScore === null) {
    return 0;
  }
  return Math.round(numericScore * 100);
}

/**
 * Check if score is valid
 */
export function isValidScore(score: string | number): boolean {
  const numericScore = typeof score === 'string' ? parseFloat(score) : score;
  return !(
    isNaN(numericScore) ||
    numericScore === undefined ||
    numericScore === null
  );
}
