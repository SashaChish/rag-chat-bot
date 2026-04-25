import { useQuery } from "@tanstack/react-query";
import type { DocumentEntry } from "../db/types";

export function useGetDocument(id: string | undefined) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: async () => {
      const response = await fetch(`/api/documents/${encodeURIComponent(id!)}`);

      if (!response.ok) {
        throw new Error("Failed to load preview");
      }

      return response.json() as Promise<DocumentEntry>;
    },
    enabled: Boolean(id),
  });
}
