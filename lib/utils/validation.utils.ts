/**
 * Validation Utility Functions
 * Helper functions for validating user input
 */

/**
 * Validate query string
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
 * Sanitize user input to remove potentially harmful characters
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
