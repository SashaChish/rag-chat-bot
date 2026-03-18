/**
 * Engine Constants
 * Constants related to query and chat engines
 */

/**
 * Query engine types
 */
export const QUERY_ENGINE_TYPES = ['default', 'router', 'subquestion'] as const;

/**
 * Chat engine types
 */
export const CHAT_ENGINE_TYPES = ['condense', 'context'] as const;

/**
 * Default query engine type
 */
export const DEFAULT_QUERY_ENGINE = 'default' as const;

/**
 * Default chat engine type
 */
export const DEFAULT_CHAT_ENGINE = 'condense' as const;

/**
 * Query engine descriptions
 */
export const QUERY_ENGINE_DESCRIPTIONS: Record<string, string> = {
  default: 'Direct vector search with similarity scoring',
  router: 'LLM-based router for complex queries',
  subquestion: 'Decomposes queries into sub-questions',
};

/**
 * Chat engine descriptions
 */
export const CHAT_ENGINE_DESCRIPTIONS: Record<string, string> = {
  condense: 'Condenses conversation history into standalone queries',
  context: 'Provides retrieved context directly to the LLM',
};
