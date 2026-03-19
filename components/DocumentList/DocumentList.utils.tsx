/**
 * DocumentList Component Utilities
 * Helper functions specific to the DocumentList component
 */

import type { DocumentData } from './DocumentList.types';
import { formatDate } from '../../lib/utils/date.utils';
import {
  PdfFileIcon,
  DocxFileIcon,
  MarkdownFileIcon,
  TextFileIcon,
  DefaultFileIcon,
} from '@/lib/icons';

/**
 * Get file icon component based on file type
 */
export function getFileIcon(fileType: string): JSX.Element {
  const iconMap: Record<string, JSX.Element> = {
    PDF: <PdfFileIcon />,
    TEXT: <TextFileIcon />,
    MARKDOWN: <MarkdownFileIcon />,
    DOCX: <DocxFileIcon />,
  };
  return iconMap[fileType] || <DefaultFileIcon />;
}

/**
 * Format document date for display
 */
export function formatDocumentDate(dateString: string): string {
  return formatDate(dateString);
}

/**
 * Format chunk count for display
 */
export function formatChunkCount(count: number): string {
  return `${count} chunk${count !== 1 ? 's' : ''}`;
}

/**
 * Check if document has preview content
 */
export function hasPreviewContent(document: DocumentData): boolean {
  return Boolean(document.content && document.content.trim().length > 0);
}

/**
 * Check if document can be downloaded
 */
export function canDownload(document: DocumentData): boolean {
  return Boolean(document.can_download);
}

/**
 * Sort documents by upload date
 */
export function sortDocumentsByDate(documents: DocumentData[]): DocumentData[] {
  return [...documents].sort((a, b) =>
    new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime(),
  );
}
