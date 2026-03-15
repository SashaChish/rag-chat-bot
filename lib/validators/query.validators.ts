/**
 * Query Validators
 * Validation functions for query-related operations
 */

/**
 * Validate query string for search/queries
 */
export function validateQuery(query: string): boolean {
  // Check if query is empty or whitespace only
  if (!query || query.trim().length === 0) {
    throw new Error('Query cannot be empty');
  }

  const trimmed = query.trim();

  if (trimmed.length < 5) {
    throw new Error('Query must be at least 5 characters long');
  }

  // Check maximum length
  if (trimmed.length > 1000) {
    throw new Error('Query must be less than 1000 characters');
  }

  return true;
}

/**
 * Validate query engine type
 */
export function validateQueryEngineType(type: string): boolean {
  const validTypes = ['default', 'router', 'subquestion'];
  return validTypes.includes(type);
}

/**
 * Validate chat engine type
 */
export function validateChatEngineType(type: string): boolean {
  const validTypes = ['condense', 'context'];
  return validTypes.includes(type);
}

/**
 * Validate agent type
 */
export function validateAgentType(type: string | null): boolean {
  if (type === null) return true;
  const validTypes = ['react', 'openai'];
  return validTypes.includes(type);
}

/**
 * Validate session key
 */
export function validateSessionKey(sessionKey: string | null): boolean {
  if (sessionKey === null) return true;
  return typeof sessionKey === 'string' && sessionKey.length > 0;
}
