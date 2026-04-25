import { useMutation } from "@tanstack/react-query";
import type { DocumentEntry } from "../db/types";

export function useDocumentDownload() {
  return useMutation({
    mutationKey: ["download-document"],
    mutationFn: async (doc: DocumentEntry): Promise<DocumentEntry> => {
      const { id, filename } = doc;

      const response = await fetch(
        `/api/documents/${encodeURIComponent(id!)}/download`,
      );

      if (!response.ok) {
        throw new Error("Failed to download document");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return doc;
    },
  });
}
