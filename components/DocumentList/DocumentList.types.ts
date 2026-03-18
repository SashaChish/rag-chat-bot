/**
 * DocumentList Component Types
 * Type definitions specific to the DocumentList component
 */

/**
 * Document statistics interface
 */
export interface DocumentStats {
  exists: boolean;
  count: number;
  collectionName: string;
}

/**
 * Supported format interface
 */
export interface SupportedFormat {
  type: string;
  extensions: string;
}

/**
 * Document data interface
 */
export interface DocumentData {
  id: string;
  file_name: string;
  file_type: string;
  upload_date: string;
  chunk_count: number;
  file_size?: string;
  can_download: boolean;
  content?: string;
}

/**
 * DocumentList component state interface
 */
export interface DocumentListState {
  stats: DocumentStats | null;
  supportedFormats: SupportedFormat[];
  documents: DocumentData[];
  initialLoading: boolean;
  refreshing: boolean;
  listLoading: boolean;
  selectedDocument: DocumentData | null;
  showDetails: boolean;
  showPreview: boolean;
  showDeleteConfirm: boolean;
  documentToDelete: DocumentData | null;
  error: string | null;
}
