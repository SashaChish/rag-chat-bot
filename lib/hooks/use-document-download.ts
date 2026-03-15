import { useMutation } from '@tanstack/react-query';
import type { DocumentData } from '@/components/DocumentList/DocumentList.types';

export function useDocumentDownload() {
  return useMutation({
    mutationKey: ['download-document'],
    mutationFn: (doc: DocumentData): Promise<DocumentData> => {
      const { file_url, file_name } = doc;

      if (!file_url) {
        throw new Error('No file URL available for download');
      }

      return new Promise((resolve) => {
        const link = document.createElement('a');
        link.href = file_url;
        link.download = file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        resolve(doc);
      });
    },
  });
}
