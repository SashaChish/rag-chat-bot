/**
 * DocumentList Component Utilities
 * Helper functions specific to the DocumentList component
 */

import type { DocumentData } from "./DocumentList.types";
import { formatDate } from "../../lib/utils/date.utils";
import { IconFileTypePdf, IconFile, IconFileText } from '@tabler/icons-react';

/**
 * Get file icon component based on file type
 */
export function getFileIcon(fileType: string) {
  const iconMap: Record<string, React.ReactElement> = {
    PDF: <IconFileTypePdf size={20} aria-hidden="true" />,
    TEXT: <IconFile size={20} aria-hidden="true" />,
    MARKDOWN: <IconFileText size={20} aria-hidden="true" />,
    DOCX: <IconFile size={20} aria-hidden="true" />,
  };
  return iconMap[fileType] || <IconFile size={20} aria-hidden="true" />;
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
  return `${count} chunk${count !== 1 ? "s" : ""}`;
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
  return [...documents].sort(
    (a, b) =>
      new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime(),
  );
}
