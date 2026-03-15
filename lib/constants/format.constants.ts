/**
 * Format Constants
 * Constants related to file formats and extensions
 */

/**
 * Map of format names to their extensions
 */
export const FORMAT_NAME_TO_EXTENSIONS: Record<string, string[]> = {
  PDF: ['pdf'],
  TEXT: ['txt'],
  MARKDOWN: ['md', 'markdown'],
  DOCX: ['docx'],
};

/**
 * Map of file extensions to format types
 */
export const EXTENSION_TO_FORMAT: Record<string, string> = {
  pdf: 'PDF',
  txt: 'TEXT',
  md: 'MARKDOWN',
  markdown: 'MARKDOWN',
  docx: 'DOCX',
};

/**
 * Supported format icons
 */
export const FORMAT_ICONS: Record<string, string> = {
  PDF: '📕',
  TEXT: '📄',
  MARKDOWN: '📝',
  DOCX: '📘',
};

/**
 * All supported extensions
 */
export const SUPPORTED_EXTENSIONS = [
  'pdf',
  'txt',
  'md',
  'markdown',
  'docx',
];

/**
 * All supported format names
 */
export const SUPPORTED_FORMATS = ['PDF', 'TEXT', 'MARKDOWN', 'DOCX'];
