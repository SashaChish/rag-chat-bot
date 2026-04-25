import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DocumentEntry } from "../db/types";

export function useDocumentDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/documents/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete document");
      }
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["documents"] });
      const previousDocuments = queryClient.getQueryData<{
        documents: DocumentEntry[];
      }>(["documents"]);

      queryClient.setQueryData<{ documents: DocumentEntry[] }>(
        ["documents"],
        (old) =>
          old
            ? { documents: old.documents.filter((doc) => doc.id !== id) }
            : old,
      );

      return { previousDocuments };
    },
    onError: (error, _id, context) => {
      console.error("Error deleting document:", error);

      if (context?.previousDocuments) {
        queryClient.setQueryData(["documents"], context.previousDocuments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
