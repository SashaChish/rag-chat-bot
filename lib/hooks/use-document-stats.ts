import { useQuery } from '@tanstack/react-query';
import type { DocumentStats } from '@/components/DocumentList/DocumentList.types';

export function useDocumentStats() {
  return useQuery({
    queryKey: ['documents-stats'],
    queryFn: async () => {
      const response = await fetch('/api/documents');
      if (!response.ok) {
        throw new Error('Failed to load document stats');
      }
      return response.json() as Promise<{ stats: DocumentStats }>;
    },
  });
}
