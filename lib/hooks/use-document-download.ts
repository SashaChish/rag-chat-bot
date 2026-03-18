import { useMutation } from '@tanstack/react-query';
import type { DocumentData } from '@/components/DocumentList/DocumentList.types';

export function useDocumentDownload() {
  return useMutation({
    mutationKey: ['download-document'],
    mutationFn: async (doc: DocumentData): Promise<DocumentData> => {
      const { id, file_name, can_download } = doc;

      if (!can_download) {
        throw new Error('Download not available for this document');
      }

      const response = await fetch(`/api/documents/${id}?action=download`);

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return doc;
    },
  });
}
