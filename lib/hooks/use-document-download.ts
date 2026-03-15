import { useMutation } from '@tanstack/react-query';
import type { DocumentData } from '@/components/DocumentList/DocumentList.types';

export function useDocumentDownload() {
  return useMutation({
    mutationKey: ['download-document'],
    mutationFn: (doc: DocumentData): Promise<DocumentData> => {
      if (!doc.file_url) {
        throw new Error('No file URL available for download');
      }

      return new Promise((resolve) => {
        const link = document.createElement('a');
        link.href = doc.file_url!;
        link.download = doc.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        resolve(doc);
      });
    },
  });
}
