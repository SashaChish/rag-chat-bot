/**
 * MessageList Component Types
 * Type definitions specific to the MessageList component
 */

/**
 * Similarity bar component props
 */
export interface SimilarityBarProps {
  score: string | number;
}

/**
 * Source explanation interface
 */
export interface SourceExplanation {
  text: string;
  chunks: number;
  documents: number;
}
