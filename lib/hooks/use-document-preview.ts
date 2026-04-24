import { useQuery } from '@tanstack/react-query';

export function useDocumentPreview(
  fileName: string | undefined,
  options: { enabled: boolean },
) {
  return useQuery({
    queryKey: ['document-preview', fileName],
    queryFn: async () => {
      const response = await fetch(
        `/api/documents/${encodeURIComponent(fileName!)}/preview`,
      );
      if (!response.ok) {
        throw new Error('Failed to load preview');
      }
      return response.json() as Promise<{ content: string }>;
    },
    enabled: options.enabled,
  });
}
