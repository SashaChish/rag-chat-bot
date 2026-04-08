import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DocumentData } from '@/components/DocumentList/DocumentList.types';

export function useDocumentDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/documents/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete document');
      }
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['documents-list'] });
      const previousDocuments = queryClient.getQueryData<{ documents: DocumentData[] }>(['documents-list']);

      queryClient.setQueryData<{ documents: DocumentData[] }>(['documents-list'], (old) =>
        old ? { documents: old.documents.filter(doc => doc.id !== id) } : old
      );

      return { previousDocuments };
    },
    onError: (error, _id, context) => {
      console.error('Error deleting document:', error);
      if (context?.previousDocuments) {
        queryClient.setQueryData(['documents-list'], context.previousDocuments);
      }
      alert(error instanceof Error ? error.message : 'Failed to delete document');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['documents-stats'] });
      queryClient.invalidateQueries({ queryKey: ['documents-list'] });
    },
  });
}
