import type { GetDocumentsResponse } from "@/app/api/documents/types";

import { useQuery } from "@tanstack/react-query";

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const response = await fetch("/api/documents");
      if (!response.ok) {
        throw new Error("Failed to load documents");
      }
      return response.json() as Promise<GetDocumentsResponse>;
    },
  });
}
