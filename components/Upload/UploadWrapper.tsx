"use client";

import { useQuery } from "@tanstack/react-query";
import Upload from "@/components/Upload/Upload";
import type { DocumentUploadResponse, SupportedFormat } from "@/lib/types/api";

export default function UploadWrapper() {
  const { data: formatsData } = useQuery({
    queryKey: ["documents-formats"],
    queryFn: async () => {
      const response = await fetch("/api/documents");
      if (!response.ok) {
        throw new Error("Failed to fetch supported formats");
      }
      return response.json() as Promise<{
        supportedFormats: SupportedFormat[];
      }>;
    },
    retry: 1,
  });

  const { supportedFormats } = formatsData || {};
  const formatTypes = supportedFormats?.map((f) => f.type) || [
    "PDF",
    "TEXT",
    "MARKDOWN",
    "DOCX",
  ];

  function handleUploadSuccess(data: DocumentUploadResponse): void {
    window.dispatchEvent(new CustomEvent("documentUploaded", { detail: data }));
  }

  return (
    <Upload
      onUploadSuccess={handleUploadSuccess}
      supportedFormats={formatTypes}
    />
  );
}
