import type { DocumentEntry } from "@/lib/db/types";

export interface DocumentStats {
  exists: boolean;
  count: number;
  collectionName: string;
}

export interface DocumentListState {
  stats: DocumentStats | null;
  documents: DocumentEntry[];
  initialLoading: boolean;
  refreshing: boolean;
  listLoading: boolean;
  selectedDocument: DocumentEntry | null;
  showDetails: boolean;
  showPreview: boolean;
  showDeleteConfirm: boolean;
  documentToDelete: DocumentEntry | null;
  error: string | null;
}
