import { useQuery } from '@tanstack/react-query';
import type { DocumentData } from '@/components/DocumentList/DocumentList.types';

export function useDocumentList() {
  return useQuery({
    queryKey: ['documents-list'],
    queryFn: async () => {
      const response = await fetch('/api/documents/list');
      if (!response.ok) {
        throw new Error('Failed to load document list');
      }
      return response.json() as Promise<{ documents: DocumentData[] }>;
    },
  });
}
