import type { DocumentEntry } from "@/lib/db/types";
import type { IndexStats } from "@/lib/types";

export interface UploadDocumentResponse {
  document: Omit<DocumentEntry, "fileSize"> & { fileSize: string };
  message: string;
}

export interface GetDocumentsResponse {
  documents: DocumentEntry[];
  stats: IndexStats;
}
